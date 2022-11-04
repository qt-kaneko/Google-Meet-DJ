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

    let convertedVolume;
    if (this.#volume < 0) throw `value must be greater than 0`;
    else if (this.#volume < 1) convertedVolume = -1 + this.#volume;
    else convertedVolume = this.#volume;

    console.debug(`[Google Meet DJ] Converted volume from`, this.#volume, `to`, convertedVolume);

    this.#gain.value = convertedVolume;
  }

  /** @type {Number} */
  static #volume = 1;

  static #gain;
  static #gainNode;

  static
  {
    console.debug(`[Google Meet DJ] Starting...`);

    this.#redirectAudio();

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

  static #redirectAudio(element)
  {
    console.debug(`Setting up audio redirection...`);

    let context = new wrappedJSObject.AudioContext();

    this.#gainNode = new wrappedJSObject.GainNode(context);
    this.#gainNode.connect(context.destination);

    for (let audio of wrappedJSObject.document.querySelectorAll(`audio`))
    {
      let source = context.createMediaElementSource(audio);
      source.connect(this.#gainNode);
    }
    new wrappedJSObject.MutationObserver((mutationList, observer) => {
      for (let mutation of mutationList)
      {
        for (let addedElement of mutation.addedNodes)
        {
          console.debug(addedElement);

          if (addedElement.nodeName === `AUDIO`)
          {
            console.debug(`FUCK!!!`);

            let source = context.createMediaElementSource(cloneInto(audio, window, {cloneFunctions: true}));
            source.connect(this.#gainNode);
          }
        }
      }
    }).observe(wrappedJSObject.document.documentElement, cloneInto({childList: true, subtree: true}, wrappedJSObject.window));

    this.#gain = this.#gainNode.gain;

    console.debug(`Audio redirection has been set up successfully.`);
  }
}