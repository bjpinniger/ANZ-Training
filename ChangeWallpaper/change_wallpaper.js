import xapi from 'xapi';


function guiEvent(event) {
  const { WidgetId, Type, Value } = event;
  console.log(WidgetId);
    if (WidgetId === 'paris' && event.Type === 'pressed') {
      const wallpaperUrl = "https://www.employees.org/~dhenwood/WbxWallpaper/Wallpaper07.zip";
      changeWallpaper(wallpaperUrl);
  }else if (WidgetId === 'sydney' && event.Type === 'pressed') {
    const wallpaperUrl = "https://www.employees.org/~dhenwood/WbxWallpaper/Wallpaper08.zip";
      changeWallpaper(wallpaperUrl);
  }else if (WidgetId === 'newyork' && event.Type === 'pressed') {
    const wallpaperUrl = "https://www.employees.org/~dhenwood/WbxWallpaper/Wallpaper06.zip";
      changeWallpaper(wallpaperUrl);
  }else if (WidgetId === 'waterfall' && event.Type === 'pressed') {
    const wallpaperUrl = "https://www.employees.org/~dhenwood/WbxWallpaper/Wallpaper02.zip";
      changeWallpaper(wallpaperUrl);
  }else if (WidgetId === 'snow' && event.Type === 'pressed') {
    const wallpaperUrl = "https://www.employees.org/~dhenwood/WbxWallpaper/Wallpaper04.zip";
      changeWallpaper(wallpaperUrl);
  }else if (WidgetId === 'sunset' && event.Type === 'pressed') {
    const wallpaperUrl = "https://www.employees.org/~dhenwood/WbxWallpaper/Wallpaper03.zip";
      changeWallpaper(wallpaperUrl);
  }
}

function changeWallpaper(url){
  sendMessage();
  clearBtnSelection();
  
  xapi.command('Provisioning Service Fetch', { URL: url });
}

function clearBtnSelection(){
  xapi.command('UserInterface Extensions Panel Close');
}

function sendMessage(){
  const displaytitle = 'Information';
  const displaytext = 'Updating wallpaper takes a moment';
  xapi.command("UserInterface Message Alert Display", {Title: displaytitle, Text: displaytext, Duration: 8});
}

xapi.event.on('UserInterface Extensions Widget Action', (event) => {
  guiEvent(event);
});