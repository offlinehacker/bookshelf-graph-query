# Bookshelf graph query

[![Greenkeeper badge](https://badges.greenkeeper.io/offlinehacker/bookshelf-graph-query.svg)](https://greenkeeper.io/)

This plugin works with Bookshelf.js, available here http://bookshelfjs.org.
It provides graph query, which makes graph-like queries using bookshelf
relations.

## Installation

    npm install bookshelf-graph-query

Then in your bookshelf configuration:

    var bookshelf = require('bookshelf')(knex);
    bookshelf.plugin(require('bookshelf-graph-query'));

## Usage

Example query

    bookshelf.plugin('registry');
    bookshelf.plugin(require('bookshelf-graph-query'));

    bookshelf.model('GroupAdmin', bookshelf.Model.extend({
      tableName: 'group_admins',
    }));

    bookshelf.model('User', bookshelf.Model.extend({
      tableName: 'groups',

      admins: function() {
        return this.belongsToMany('User').through('GroupAdmin');
      },
    }));

    bookshelf.model('Admin', bookshelf.Model.extend({
      tableName: 'admins',
    }));

    bookshelf.model('User', bookshelf.Model.extend({
      tableName: 'users',

      groups: function() {
        return this.hasMany(Group);
      },
      admin: function() {
        return this.hasOne(Admin);
      }
    }));

    // Fetches all users that have group that has admin with id 100 and
    // have super admin role
    bookshelf.model('User').forge().graphQuery({
      group: { admins: 100 },
      admin: { q: {role: 'super'} }
    })
