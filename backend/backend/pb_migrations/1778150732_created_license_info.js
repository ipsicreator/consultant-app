/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "4s61frlmgml6ouh",
    "created": "2026-05-07 10:45:32.313Z",
    "updated": "2026-05-07 10:45:32.313Z",
    "name": "license_info",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "k9w4lcwp",
        "name": "field",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("4s61frlmgml6ouh");

  return dao.deleteCollection(collection);
})
