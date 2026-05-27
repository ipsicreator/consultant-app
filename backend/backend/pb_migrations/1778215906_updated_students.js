/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("09yr4xxzoiki07p")

  collection.listRule = "id != \"\""
  collection.viewRule = "id != \"\""

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("09yr4xxzoiki07p")

  collection.listRule = ""
  collection.viewRule = ""

  return dao.saveCollection(collection)
})
