/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("z0zr97zbimz0i5g")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "9h1pqsm1",
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
  const collection = dao.findCollectionByNameOrId("z0zr97zbimz0i5g")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "9h1pqsm1",
    "name": "fieldactive",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  return dao.saveCollection(collection)
})
