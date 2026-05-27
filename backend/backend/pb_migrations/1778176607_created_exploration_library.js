/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "7ai1alblsw4458p",
    "created": "2026-05-07 17:56:47.540Z",
    "updated": "2026-05-07 17:56:47.540Z",
    "name": "exploration_library",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "6rsmn2xo",
        "name": "book_title",
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
        "id": "uqvrmaew",
        "name": "author",
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
        "id": "uywyk0ck",
        "name": "inquiry_title",
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
        "id": "phf6rz2i",
        "name": "inquiry_content",
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
        "id": "d57yar9v",
        "name": "category",
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
        "id": "hsuuew2e",
        "name": "source_type",
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
  const collection = dao.findCollectionByNameOrId("7ai1alblsw4458p");

  return dao.deleteCollection(collection);
})
