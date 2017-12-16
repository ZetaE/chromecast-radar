var ChromecastRadar = require('./index');

var chromecastRadar = new ChromecastRadar()
  .on('deviceUp',function(dev){
    console.log('chromecast %s runnning on: %s',
      dev.name,
      dev.data);
  })
  .on('deviceDown',function(dev){
    console.log('chromecast %s runnning on: %s is now disconnected',
      dev.name,
      dev.data);
  });
  
//chromecastRadar.close();