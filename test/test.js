var Chromecastradar = require('../index');

var cradar = new Chromecastradar();
cradar.browse().on('deviceUp',function(dev){
  console.log('!!!!!!! -- DEVICE UP -- !!!!!!!')
  console.log(dev);
}).on('deviceDown',function(dev){
  console.log('!!!!!!! -- DEVICE DOWN -- !!!!!!!')
  console.log(dev);
});
