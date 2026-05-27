/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "zhvavbh22irf4yb",
    "created": "2026-05-07 17:56:47.470Z",
    "updated": "2026-05-07 17:56:47.470Z",
    "name": "profiles",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ofl2xmum",
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
        "id": "kzwomno6",
        "name": "full_name",
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
        "id": "q41zeesc",
        "name": "role",
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
        "id": "6kpyayar",
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
  const collection = dao.findCollectionByNameOrId("zhvavbh22irf4yb");

  return dao.deleteCollection(collection);
})
