/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("zhvavbh22irf4yb")

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "usrrel01",
    "name": "user",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": true,
    "options": {
      "collectionId": "_pb_users_auth_",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": ["email", "name"]
    }
  }))

  collection.indexes = [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_unique ON profiles (user) WHERE user != ''"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("zhvavbh22irf4yb")

  collection.schema.removeField("usrrel01")
  collection.indexes = []

  return dao.saveCollection(collection)
})

