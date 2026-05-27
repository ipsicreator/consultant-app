/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("kd2usnq1e3px70j")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "ztqckm5c",
    "name": "active",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("kd2usnq1e3px70j")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "ztqckm5c",
    "name": "fieldactive",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
})
