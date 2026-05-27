/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "09yr4xxzoiki07p",
    "created": "2026-05-07 17:56:47.496Z",
    "updated": "2026-05-07 17:56:47.496Z",
    "name": "students",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "iipzmqin",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 0,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "clcbubid",
        "name": "school",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 0,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "pjxh5riq",
        "name": "grade",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 0,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "scvbc7kq",
        "name": "enrollment_status",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 0,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "yv5pgzwj",
        "name": "academy_id",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 0,
          "pattern": ""
        }
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("09yr4xxzoiki07p");

  return dao.deleteCollection(collection);
})
