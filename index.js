'use strict';

var _ = require('lodash');
var assert = require('hoek').assert;

module.exports = function (bookshelf) {
  var Model = bookshelf.Model;

  function constructQuery(path, qb) {
    var self = this;
    qb = qb || this.query();

    if (_.isObject(path) && path.q) {
      if (_.isObject(path.q)) {
        qb.where(path.q);
      } else {
        qb.where(this.tableName + '.' + this.idAttribute, '=', path.q);
      }
    } else if (!_.isObject(path)) {
      return path;
    }

    _.mapKeys(path, function (value, key) {
      if (key === 'q') {
        return;
      }

      assert(self[key], key + ': relation does not exist');

      var relation = self[key]();
      var data = relation.relatedData;
      var model = data.target.forge();
      var q = constructQuery.call(model, value);
      q = _.isObject(q) ? q.select(data.targetIdAttribute) : q;

      var targetKey = data.type === 'belongsTo' ?
        data.key('otherKey') :
        data.key('foreignKey');

      // Join with foreign tables
      if  (data.isJoined()) {
        var joinTable = data.joinTable();

        if (
          data.type === 'belongsTo' ||
            data.type === 'belongsToMany'
        ) {
          var targetKey = data.type === 'belongsTo' ?
            data.key('otherKey') :
            data.key('foreignKey');

          qb.join(
            joinTable,
            joinTable + '.' + targetKey, '=',
            data.parentTableName + '.' + data.parentIdAttribute
          );
        }

        qb.where(joinTable + '.' + data.key('otherKey'), 'in', q);
      } else {
        var targetTable = data.type === 'belongsTo' ?
          data.parentTableName : data.targetTableName;
        var parentTable = data.type === 'belongsTo' ?
          data.targetTableName : data.parentTableName;
        var key = data.type !== 'belongsTo' ?
          data.parentIdAttribute : data.key('otherKey');
        qb.join(
          data.targetTableName,
          targetTable + '.' + targetKey, '=',
          parentTable + '.' + data.parentIdAttribute
        );
        qb.where(targetTable + '.' + key, 'in', q);
      }
    });

    return qb;
  }

  bookshelf.Model = Model.extend({
    graphQuery: function(path) {
      var self = this;
      return this.query(function(qb) {
        constructQuery.call(self, path, qb);
      });
    }
  });

};
