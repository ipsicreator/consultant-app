/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("zhvavbh22irf4yb")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "adminid1",
    "name": "admin_id",
    "type": "text",
    "required": false,
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
  const collection = dao.findCollectionByNameOrId("zhvavbh22irf4yb")

  // remove
  collection.schema.removeField("adminid1")

  return dao.saveCollection(collection)
})
