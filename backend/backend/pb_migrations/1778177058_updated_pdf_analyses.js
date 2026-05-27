/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("dp10huirai93noo")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "ug9xejsc",
    "name": "student_id",
    "type": "text",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": 0,
      "max": 2000,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("dp10huirai93noo")

  // update
  collection.schema.addField(new SchemaField({
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
  }))

  return dao.saveCollection(collection)
})
