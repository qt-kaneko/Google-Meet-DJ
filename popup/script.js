// This file is part of Google Meet DJ.
//
// Google Meet DJ is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
//
// Google Meet DJ is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Google Meet DJ. If not, see <https://www.gnu.org/licenses/>.
// Copyright 2022 Kaneko Qt

`use strict`;

async function getCurrentTab()
{
  return browser.tabs.query({
    currentWindow: true,
    active: true
  }).then(tabs => tabs[0]);
}

window.addEventListener(`load`, onLoad);
async function onLoad()
{
  let slider = document.querySelector(`#slider`);

  slider.addEventListener(`input`, e => onVolumeChange(e));

  let currentTab = await getCurrentTab();
  slider.value = await browser.tabs.sendMessage(currentTab.id, {
    [`VolumeControl`]: {[`get_volume`]: null}
  });
}

async function onVolumeChange(e)
{
  let newVolume = e.target.value;

  let currentTab = await getCurrentTab();
  await browser.tabs.sendMessage(currentTab.id, {
    [`VolumeControl`]: {[`set_volume`]: newVolume}
  });
}