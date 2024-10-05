# Dynamo DB Provider

Basic scheme to be described

- Introduction
- Division - provider +  SingleTable = schema + repository (KINDA orm, not really)
- Explain provider
- Explain SingleTable
- SingleTable Schema -> Partition+Entity
- RepoLike -> Collection, fromCollection, fromEntity
- Create a "item_exists" & "item_not_exists" conditions that merge the use of pk+sk exists/not_exists operations. Make it accept the 2 values on provider and autofill on single table

