var cachedConfig = {};
var cachedConfigLoaded = false;
module.exports = cachedConfig;
cachedConfig.load = function(host, callback) {
    if (!callback) {
        callback = host;
        host = '127.0.0.1';
    }
    if (cachedConfigLoaded) {
        return setImmediate(function () {
            callback(null, cachedConfig);
        });
    }
    var path = require('path');
    var Etcd = require('node-etcd');
    var etcd = new Etcd(host);
    var rootPath = './../../../';
    var packageContents = require(rootPath + 'package.json');
    var etcdPath = path.join('/', 'config', packageContents.name);
    etcd.get(etcdPath, function (err, value) {
        if (err) {
            if (err.errorCode === 100) {
                var fileConfig = require(rootPath + 'config/config.json');
                etcd.set(etcdPath, JSON.stringify(fileConfig));
                callback(null, fileConfig);
            } else {
                callback(err);
            }
            return;
        }
        var retrievedConfig = JSON.parse(value.node.value);
        for (var prop in retrievedConfig) {
            cachedConfig[prop] = retrievedConfig[prop];
        }
        cachedConfigLoaded = true;
        callback(null, retrievedConfig);
    });
};
