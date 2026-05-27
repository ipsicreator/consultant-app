/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("zhvavbh22irf4yb")

  collection.listRule = "id != \"\""
  collection.viewRule = "id != \"\""

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("zhvavbh22irf4yb")

  collection.listRule = ""
  collection.viewRule = ""

  return dao.saveCollection(collection)
})
