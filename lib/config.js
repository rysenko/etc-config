var ConfigLoader = (function() {
  function ConfigLoader() {
    this.rootPath = './../../../';
    this.cachedConfig = this.loadOriginal();
    this.cachedConfigLoaded = false;
    this.cachedConfig.load = this.load.bind(this);
    return this.cachedConfig;
  }
  ConfigLoader.prototype.loadOriginal = function() {
    var originalConfig = require(this.rootPath + 'config/config.json');
    for (var key in process.env) {
      if (key.indexOf('ETCO_') === 0) {
        var overrideValue = process.env[key];
        var keyParts = key.split('_').slice(1);
        var currentNode = originalConfig;
        for (var i = 0; i < keyParts.length; i++) {
          var keyPart = keyParts[i];
          if (i === keyParts.length - 1) {
            currentNode[keyPart] = overrideValue;
          } else {
            currentNode[keyPart] = currentNode[keyPart] || {};
            currentNode = currentNode[keyPart];
          }
        }
      }
    }
    return originalConfig;
  };
  ConfigLoader.prototype.loadEtcd = function(host, callback) {
    if (!callback) {
      callback = host;
      host = '127.0.0.1';
    }
    if (this.cachedConfigLoaded) {
      return setImmediate((function () {
        callback(null, this.cachedConfig);
      }).bind(this));
    }
    var Etcd = require('node-etcd');
    this.etcdClient = new Etcd(host);
    var packageContents = require(this.rootPath + 'package.json');
    this.etcdPath = '/config/' + packageContents.name;
    this.etcdClient.get(this.etcdPath, callback);
  };
  ConfigLoader.prototype.load = function(host, callback) {
    this.loadEtcd(host, (function(err, value) {
      if (err) {
        if (err.errorCode === 100) {
          this.etcdClient.set(this.etcdPath, JSON.stringify(this.cachedConfig));
          callback(null, this.cachedConfig);
        } else {
          callback(err);
        }
        return;
      }
      var retrievedConfig = JSON.parse(value.node.value);
      for (var prop in retrievedConfig) {
        this.cachedConfig[prop] = retrievedConfig[prop];
      }
      this.cachedConfigLoaded = true;
      callback(null, retrievedConfig);
    }).bind(this));
  };
  return ConfigLoader;
})();

module.exports = new ConfigLoader();
