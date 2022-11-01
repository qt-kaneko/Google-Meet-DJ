// This file is part of Google Meet DJ.
//
// Google Meet DJ is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
//
// Google Meet DJ is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Google Meet DJ. If not, see <https://www.gnu.org/licenses/>.
// Copyright 2022 Kaneko Qt

`use strict`;

class VolumeControl
{
  /** @type {Number} */
  static get volume() { return this.#volume; }
  static set volume(value)
  {
    this.#volume = value;

    for (let element of document.querySelectorAll(`audio`))
    {
      // Call original volume setter to bypass interception
      this.#mediaVolumeSetFunc.call(element, value); // element.volume = value
    }
  }

  /** @type {Number} */
  static #volume = 1;

  /** 
   * Original HTMLMediaElement.volume.set
   * 
   * @type {Function}
   */
  static #mediaVolumeSetFunc;

  static
  {
    console.debug(`[Google Meet DJ] Starting...`);

    this.#interceptVolumeChanges();

    // Register "message-exported" members
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => { // this.volume getter
      if (message[`VolumeControl`]?.[`get_volume`] !== undefined)
      {
        console.debug(`[Google Meet DJ] "Message-exported" get_volume invoked, returning:`, this.volume);
        sendResponse(this.volume);
      }
    });
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => { // this.volume setter
      let newVolume;
      if ((newVolume = message[`VolumeControl`]?.[`set_volume`]) !== undefined)
      {
        console.debug(`[Google Meet DJ] "Message-exported" set_volume invoked, arguments:`, newVolume);
        this.volume = newVolume;
      }
    });
  }

  static #onMediaVolumeSet(value)
  {
    console.debug(`[Google Meet DJ] Volume change intercepted, passed value was:`, value);
  }
  static #interceptVolumeChanges()
  {
    console.debug(`[Google Meet DJ] Registering interceptor...`);

    let UObject = window.wrappedJSObject.Object; // Unwrapped Object
    UObject.u_defineProperty = UObject.defineProperty;
    UObject.defineProperty = (obj, prop, descriptor) => UObject.u_defineProperty(obj, prop, cloneInto(descriptor, window, {cloneFunctions: true}));

    let UHTMLMediaElement = window.wrappedJSObject.HTMLMediaElement; // Unwrapped HTMLMediaElement

    let mediaProto = UHTMLMediaElement.prototype;
    console.debug(`[Google Meet DJ] Media prototype:`, mediaProto);

    let mediaVolume = UObject.getOwnPropertyDescriptor(mediaProto, `volume`);
    console.debug(`[Google Meet DJ] Media volume:`, mediaVolume);
    this.#mediaVolumeSetFunc = mediaVolume.set; // Save original volume setter

    // Replace original volume setter with ours
    UObject.defineProperty(mediaProto, `volume`, {
      configurable: true,
      set: this.#onMediaVolumeSet
    });

    console.debug(`[Google Meet DJ] Interceptor registered successfully!`);
  }
}