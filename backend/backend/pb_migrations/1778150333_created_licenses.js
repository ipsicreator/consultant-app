/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "z0zr97zbimz0i5g",
    "created": "2026-05-07 10:38:53.871Z",
    "updated": "2026-05-07 10:38:53.871Z",
    "name": "licenses",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "9h1pqsm1",
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
  const collection = dao.findCollectionByNameOrId("z0zr97zbimz0i5g");

  return dao.deleteCollection(collection);
})
