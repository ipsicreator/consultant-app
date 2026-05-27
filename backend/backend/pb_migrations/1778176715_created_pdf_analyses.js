/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "dp10huirai93noo",
    "created": "2026-05-07 17:58:35.322Z",
    "updated": "2026-05-07 17:58:35.322Z",
    "name": "pdf_analyses",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ug9xejsc",
        "name": "student_id",
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
        "id": "yj0jkb8f",
        "name": "content",
        "type": "json",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1048576
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
  const collection = dao.findCollectionByNameOrId("dp10huirai93noo");

  return dao.deleteCollection(collection);
})
