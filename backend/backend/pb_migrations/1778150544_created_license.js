/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "kd2usnq1e3px70j",
    "created": "2026-05-07 10:42:24.482Z",
    "updated": "2026-05-07 10:42:24.482Z",
    "name": "license",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "ztqckm5c",
        "name": "fieldactive",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
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
  const collection = dao.findCollectionByNameOrId("kd2usnq1e3px70j");

  return dao.deleteCollection(collection);
})
