'use strict';

var assert = require('chai').assert,
    chai = require('chai'),
    sinon  = require('sinon');

var bookshelf = require('bookshelf');


chai.use(require('sinon-chai'));

describe('bookshelf graph query', function() {
  before(function() {
    var knex = require('knex')({
      client: 'sqlite3', connection: { filename: ':memory:'}
    });
    this.bookshelf = require('bookshelf')(knex);
  });

  before(function() {
    this.bookshelf.plugin('registry');
    this.bookshelf.plugin(require('../'));
  });

  before(function() {
    var Model = this.bookshelf.Model;

    this.bookshelf.model('User', Model.extend({
      tableName: 'users',

      cars: function() {
        return this.hasMany('Car');
      },
      groups: function() {
        return this.belongsToMany('Group');
      },
      admin: function() {
        return this.hasOne('Admin');
      }
    }));

    this.bookshelf.model('Group', Model.extend({
      tableName: 'groups',

      users: function() {
        return this.belongsToMany('User').through('UserGroup');
      },
      roads: function() {
        return this.belongsToMany('City').through('UserRoad');
      }
    }));

    this.bookshelf.model('Road', Model.extend({
      tableName: 'roads',

      car: function() {
        return this.belongsTo('Car');
      },
      road: function() {
        return this.belongsTo('City');
      }
    }));

    this.bookshelf.model('Car', Model.extend({
      tableName: 'cars',

      user: function() {
        return this.belongsTo('User');
      }
    }));

    this.bookshelf.model('City', Model.extend({
      tableName: 'roads',

      group: function() {
        return this.belongsTo('Group');
      }
    }));
    this.bookshelf.model('Admin', Model.extend({tableName: 'admins'}));
    this.bookshelf.model('UserRoad', Model.extend({tableName: 'user_roads'}));
    this.bookshelf.model('UserGroup', Model.extend({tableName: 'user_groups'}));
  });

  describe('queryGraph()', function() {
    it('should work with belongsToMany relations', function(next) {
      var q = this.bookshelf.model('User').forge().graphQuery({groups: 100});
      assert.equal(q._knex.toString(), 'select * from "users" inner join "groups_users" on "groups_users"."user_id" = "users"."id" where "groups_users"."group_id" in (100)');
      next();
    });

    it('should work with belongsTo relations', function(next) {
      var q = this.bookshelf.model('User').forge().graphQuery({cars: 100});
      assert.equal(q._knex.toString(), 'select * from "users" inner join "cars" on "cars"."user_id" = "users"."id" where "cars"."id" in (100)');
      next();
    });

    it('should work with hasOne relation', function(next) {
      var q = this.bookshelf.model('User').forge().graphQuery({admin: 100});
      assert.equal(q._knex.toString(), 'select * from "users" inner join "admins" on "admins"."user_id" = "users"."id" where "admins"."id" in (100)');
      next();
    });

    it('should work with belongsTo relation', function(next) {
      var q = this.bookshelf.model('Car').forge().graphQuery({user: 100});
      assert.equal(q._knex.toString(), 'select * from "cars" inner join "users" on "cars"."user_id" = "users"."id" where "cars"."user_id" in (100)');
      next();
    });

    it('should work with multiple relation', function(next) {
      var q = this.bookshelf.model('User').forge().graphQuery({groups: 10, admin: 100, cars: 100});
      assert.equal(q._knex.toString(), 'select * from "users" inner join "groups_users" on "groups_users"."user_id" = "users"."id" inner join "admins" on "admins"."user_id" = "users"."id" inner join "cars" on "cars"."user_id" = "users"."id" where "groups_users"."group_id" in (10) and "admins"."id" in (100) and "cars"."id" in (100)');
      next();
    });

    it('should work accross multiple models', function(next) {
      var q = this.bookshelf.model('Road').forge().graphQuery({
        road:  {
          q: 10,
          group: 100
        },
        car: {
          q: 11,
          user: {
            groups: 100
          }
        }
      });
      assert.equal(q._knex.toString(), 'select * from "roads" inner join "roads" on "roads"."road_id" = "roads"."id" inner join "cars" on "roads"."car_id" = "cars"."id" where "roads"."road_id" in (select "id" from "roads" inner join "groups" on "roads"."group_id" = "groups"."id" where "roads"."id" = 10 and "roads"."group_id" in (100)) and "roads"."car_id" in (select "id" from "cars" inner join "users" on "cars"."user_id" = "users"."id" where "cars"."id" = 11 and "cars"."user_id" in (select "id" from "users" inner join "groups_users" on "groups_users"."user_id" = "users"."id" where "groups_users"."group_id" in (100)))');
      next();
    });
  });

});
