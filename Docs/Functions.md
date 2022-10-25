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
