var Client = require('node-ssdp-js').Client;
var debug = require('debug')('radar');
var events = require('events');
var util = require('util');
var url = require('url');
var superagent = require('superagent');
var parser = require('xml2json-light');
var _ = require('underscore');
var foia = require('foia');


var ChromeCastRadar = function(opts){
  events.EventEmitter.call(this);

  this.client = new Client();
  this.client.on('response',this.onResponse.bind(this));

  this.current_devices = [];
  this.last_devices = [];

  this.WAITING_RESPONSE = false;

  this.checkNewDevInDevicesArray = function(first, second, eventName){
    for (let i = 0; i < first.length; i++){
      let el = first[i];
      if(foia(second,el) < 0 ){
        this.emit(eventName,el)
      }
    }
    return;
  };
};

util.inherits(ChromeCastRadar, events.EventEmitter);

ChromeCastRadar.prototype.onResponse = function(msg){
  debug('on response handler');
  debug(msg);
  if(!this.WAITING_RESPONSE){
  //  debug('unexpected response');
  //  return;
  }
  var that = this;

  var location = msg.headers.LOCATION;
  var urlParts = url.parse(location);

  var request = superagent.get(location);
  request.buffer();
  request.type('xml');
  request.end(function(err, res) {
    if (err) return that.emit('error', err);

    var parsedBody = parser.xml2json(res.text);

    // Get app base url
    var appUrl = res.headers['application-url'];
    if (!appUrl) {
      debug('not a media device?');
      return;
    } // not a media device, something else?
    urlParts.pathname = urlParts.path = url.parse(appUrl).path+"/";
    var device = {
      modelName : parsedBody.root.device.modelName,
      hostname : urlParts.hostname
    };

    debug('device %s found at at %s',device.modelName,device.hostname);
    return that.addDevice(device);
  });
};

ChromeCastRadar.prototype.checkDevices = function(){
  debug('check devices routine');
  debug(this.current_devices);
  debug(this.last_devices);
  this.checkNewDevInDevicesArray(this.current_devices,this.last_devices,'deviceUp');
  this.checkNewDevInDevicesArray(this.last_devices,this.current_devices,'deviceDown');

  this.last_devices = this.current_devices;
  this.WAITING_RESPONSE = false;
  this.current_devices = [];
};

ChromeCastRadar.prototype.addDevice = function (device) {
  var devices = this.current_devices;

  if(!this.isChromecast(device)){
    debug('not a chromecast :-(')
    return;
  }

  for(let i = 0; i < devices.length ; i++){
    if(_.isEqual(devices[i],device)){
      return;
    }
  }
  this.current_devices.push(device);
};

ChromeCastRadar.prototype.isChromecast = function(device){
  return device.modelName === 'Eureka Dongle';
}

ChromeCastRadar.prototype.waitResponse = function(){
  this.WAITING_RESPONSE = true;
};

ChromeCastRadar.prototype._browse = function(){
};

ChromeCastRadar.prototype.browse = function(){
  this.client.browse('urn:dial-multiscreen-org:service:dial:1');
  this.waitResponse();
  setInterval(this.checkDevices.bind(this),10000);
  return this;
};

ChromeCastRadar.prototype.stop = function(){
  this.client.stop();
};

module.exports = ChromeCastRadar;
