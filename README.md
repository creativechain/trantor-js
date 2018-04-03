# Trantor-JS

#### Installation
```
npm install trantor-js
```

#### Serialization of data
```js
let {Author} = require("trantor-js").Content

//Serialize author data
let author = new Author('CSoY2vaLcZXRhgMsDGq86V9J9n3rVLhYAE', 'nick', 'email@example.com', 'example.com', 'description', '/IPFS/CID', ['tags']);

let bufferData = author.serialize();
console.log(bufferData.toString('hex'));
//Output: 01000271686f1f3c14aa547b824091445ab99fabc56928046e69636b11656d61696c406578616d706c652e636f6d0b6578616d706c652e636f6d0b6465736372697074696f6e092f495046532f434944085b2274616773225d

```

#### Deserialization
```js
let {Content} = require("trantor-js");
let {Author, ContentData} = Content;

let bufferData = Buffer.from('01000271686f1f3c14aa547b824091445ab99fabc56928046e69636b11656d61696c406578616d706c652e636f6d0b6578616d706c652e636f6d0b6465736372697074696f6e092f495046532f434944085b2274616773225d', 'hex');

let author = ContentData.deserialize(bufferData);
console.log(author); //Must be a Author Object
```

#### License
```
    GNU GPLv3
    
    Trantor-JS is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Trantor-JS is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Trantor-JS.  If not, see <http://www.gnu.org/licenses/gpl.html>.