# TTools

A common library for Google App Scripts

## Functions

### getScriptProperty(name `string`) `string`

Get Script property by name

#### Arguments

| Name | Type     | Default Value | Description   |
| ---- | -------- | ------------- | ------------- |
| name | `string` |               | property name |

#### Return `string`

### toRawText(str `string`) `string`

Lowercase and remove all special characters, spaces, accent

#### Arguments

| Name | Type     | Default Value | Description  |
| ---- | -------- | ------------- | ------------ |
| str  | `string` |               | input string |

#### Return `string`

### MD5(input `string`, isShortMode `boolean`) `string`

MD5 hash generator

#### Arguments

| Name        | Type               | Default Value | Description            |
| ----------- | ------------------ | ------------- | ---------------------- |
| input       | `string` `Bytes[]` |               | property name          |
| isShortMode | `boolean`          | `false`       | 4 digit shortened hash |

#### Return `string`

### getRanNum(len `Integer`) `Integer`

Generate random number with specific length

#### Arguments

| Name | Type      | Default Value | Description |
| ---- | --------- | ------------- | ----------- |
| len  | `Integer` | 6             | length      |

#### Return `Integer`

### smartCompare(a `any`, b `any`, type `string`) `boolean`

Smart compare two values, support string, number, date. Return true if equal.

#### Arguments

| Name | Type                           | Default Value | Description |
| ---- | ------------------------------ | ------------- | ----------- |
| a    | `any`                          |               | value a     |
| b    | `any`                          |               | value b     |
| type | `"string"` `"number"` `"date"` | `"string"`    | type        |

#### Return `boolean`

### isEmptyVariable(a `any`, options `Object`) `boolean`

Check if variable is empty. Return true if empty.

#### Arguments

| Name    | Type     | Default Value | Description       |
| ------- | -------- | ------------- | ----------------- |
| a       | `any`    |               | variable to check |
| options | `Object` | see below     | options           |

#### Options

| Name            | Type      | Default Value | Description                                      |
| --------------- | --------- | ------------- | ------------------------------------------------ |
| allowZero       | `boolean` | `true`        | allow `0` number                                 |
| allowEmtyString | `boolean` | `false`       | allow empty string                               |
| evenString      | `boolean` | `false`       | return true if is `"undefined"` `"null"` `"NaN"` |

#### Return `boolean`

### isValidObject(obj `Object`) `boolean`

Return true if `obj` is valid and not empty.

#### Arguments

| Name | Type     | Default Value | Description |
| ---- | -------- | ------------- | ----------- |
| obj  | `Object` |               | object      |

#### Return `boolean`

### isValidArray(arr `Array`) `boolean`

Return true if `arr` is valid and not empty.

#### Arguments

| Name | Type    | Default Value | Description |
| ---- | ------- | ------------- | ----------- |
| arr  | `Array` |               | array       |

#### Return `Boolean`

## BillSheet(options `Object`)

A class to interact with Google Sheet

### options

| Name           | Type       | Description     | Example          |
| -------------- | ---------- | --------------- | ---------------- |
| sheetId        | `string`   | GG Sheet id     |                  |
| sheetName      | `string`   | Sheet name      |                  |
| path           | `Object`   | Key-Index pairs | {id: 0, name: 1} |
| sortProp       | `string`   | Descending sort by a prop (usually timestamp) |     |
| sortType       | `string`   | `"string"` `"number"`                |                  |
| emptyPropList  | `string[]` | A list of props are required. If it empty, the row be removed|           |
| uniquePropList | `string[]`    | A list of props are unique. If any row duplicate, the row be removed |                 |
| transform      | `Object`   | A table containing functions whose input is the value of prop of the same name and the output is saved to sheet            | {id: (val) => '#'+val }      |
| fcustom        | `Function` | Like `transform` but this function run with each row and before `transform` |              |

### Methods

#### getAsJSON() `Object[]`

Get all sheet data as JSON by `path` option

#### sort() `void` ![](https://img.shields.io/badge/DEPRECATED-red)

Use `prettify` method instead

> Descending sort by `sortProp`, `sortType`. Remove empty row by `emptyPropList`, Remove duplicate row by `uniquePropList`

#### prettify() `void`

New name of `sort` method

#### append(data `{}|{}[]`) `boolean`

Append data to sheet. Return true if success

#### updateRow(query `{}`, nData `{}`) `boolean` ![](https://img.shields.io/badge/DEPRECATED-red)

Use `update` method instead<br>

>Find row by `query` and update it with `nData`. Return true if success

##### Arguments

| Name  | Type | Description               | Example                                                     |
| ----- | ---- | ------------------------- | ----------------------------------------------------------- |
| query | `{}` | `propName` `"AND"` `"OR"` | {"name": "test"}<br>{"AND": {"name": "foo", "type": "bar"}} |
| nData | `{}` | row data                  | {"foo": "bar"}                                              |

#### update(data `{}|{}[]`, idProps `string[]`) `boolean`

Update existing rows or append new rows if not exist. Return true if success<br>
Which rows to update is determined by value of each item in `idProps`. If `idProps` is not provided, append new rows.

##### Arguments

| Name    | Type       | Description   | Example        |                                           |
| ------- | ---------- | ------------- | -------------- | ----------------------------------------- |
| data    | `{}        | {}[]`         | row(s) data    | {"id": "1"}<br>[{"id": "1"}, {"id": "2"}] |
| idProps | `string[]` | id props list | ["id", "name"] |                                           |
