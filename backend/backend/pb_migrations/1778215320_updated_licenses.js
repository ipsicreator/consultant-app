/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("z0zr97zbimz0i5g")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "ld7e3lxh",
    "name": "fieldacademy_id",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "lkmd9evj",
    "name": "fieldstatus",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("z0zr97zbimz0i5g")

  // remove
  collection.schema.removeField("ld7e3lxh")

  // remove
  collection.schema.removeField("lkmd9evj")

  return dao.saveCollection(collection)
})
