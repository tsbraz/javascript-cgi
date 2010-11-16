DataAccess = function() {
}

DataAccess.prototype.getConnection = function() {
    if (this.connection === undefined) {
        if (DataAccess.connection === undefined) {
            DataAccess.connection = this.createNewConnection();
        }
        this.connection = DataAccess.connection;
    }
    return this.connection;
}

DataAccess.prototype.createNewConnection = function() {
    java.lang.Class.forName(this.connectionInfo.driver);
    var conn = java.sql.DriverManager.getConnection(this.connectionInfo.url, this.connectionInfo.username, this.connectionInfo.password);
    return conn;
}

DataAccess.prototype.execute = function(query) {
    var con = this.getConnection();
    var queryMap = this.mapQuery(query);
    var pstmt = con.prepareStatement(queryMap.query);
    return this.mappedQuery(pstmt, queryMap);
}

DataAccess.prototype.mappedQuery = function(pstmt, queryMap) {
    return {
        
        getQueryMap: function() {
            return queryMap;
        },
        
        setInt: function(paramName, paramValue) {
            var param = queryMap.parameterMap[paramName.toUpperCase()];
            if (param !== undefined) {
                for (var i = 0; i < param.length; i++) {
                    if (paramValue == null) {
                        pstmt.setNull(param[i], java.sql.Types.NUMERIC);
                    } else {
                        pstmt.setLong(param[i], paramValue);
                    }
                }
            } else {
                throw "Parameter not found: " + paramName;
            }
            return this;
        },
        
        setDouble: function(paramName, paramValue) {
            var param = queryMap.parameterMap[paramName.toUpperCase()];
            if (param !== undefined) {
                for (var i = 0; i < param.length; i++) {
                    if (paramValue == null) {
                        pstmt.setNull(param[i], java.sql.Types.NUMERIC);
                    } else {
                        pstmt.setDouble(param[i], paramValue);
                    }
                }
            } else {
                throw "Parameter not found: " + paramName;
            }
            return this;
        },
        
        setString: function(paramName, paramValue) {
            var param = queryMap.parameterMap[paramName.toUpperCase()];
            if (param !== undefined) {
                for (var i = 0; i < param.length; i++) {
                    if (paramValue == null) {
                        pstmt.setNull(param[i], java.sql.Types.VARCHAR);
                    } else {
                        pstmt.setString(param[i], paramValue);
                    }
                }
            } else {
                throw "Parameter not found: " + paramName;
            }
            return this;
        },
        
        setDate: function(paramName, paramValue) {
            var param = queryMap.parameterMap[paramName.toUpperCase()];
            if (param !== undefined) {
                for (var i = 0; i < param.length; i++) {
                    if (paramValue == null) {
                        pstmt.setNull(param[i], java.sql.Types.TIMESTAMP);
                    } else {
                        pstmt.setTimestamp(param[i], new java.sql.Timestamp(paramValue.getTime()));
                    }
                }
            } else {
                throw "Parameter not found: " + paramName;
            }
            return this;
        },
        
        setBinary: function(paramName, paramValue, length) {
            var param = queryMap.parameterMap[paramName.toUpperCase()];
            if (param !== undefined) {
                for (var i = 0; i < param.length; i++) {
                    if (paramValue == null) {
                        pstmt.setNull(param[i], java.sql.Types.BLOB);
                    } else {
                        pstmt.setBinary(param[i], Utils.IO.createByteArrayInputStream(paramValue), paramValue.length);
                    }
                }
            } else {
                throw "Parameter not found: " + paramName;
            }
            return this;
        },
        
        list: function(listener) {
            var rs = null;
            try {
                rs = pstmt.executeQuery();
                var metadata = rs.getMetaData();
                var columnCount = metadata.getColumnCount();
                var result = new Array();
                while (rs.next()) {
                    var obj = new Object();
                    for (var i = 1; i <= columnCount; i++) {
                        var column = metadata.getColumnLabel(i).toLowerCase();
                        obj[column] = rs.getObject(i);
                    }
                    if (listener !== undefined) {
                        listener(obj, rs);
                    }
                    result[result.length] = obj;
                }
                return result;
            } finally {
                try {rs.close()} catch (e) {}
                try {pstmt.close()} catch (e) {}
            }
        },
        
        update: function() {
            try {
                return pstmt.executeUpdate();
            } finally {
                try {pstmt.close()} catch (e) {}
            }
        }
    }
}

DataAccess.prototype.mapQuery = function(query) {
    query += " ";
    var map = {
        parameterMap: {},
        query: ""
    };
    var sb = Utils.String.createStringBuilder();
    var parameterIndex = 1;
    for (var i = 0; i < query.length; i++) {
        var c = query.charAt(i);
        if (c == "\'") {
            i = this.readQueryString(sb, query, i);
        } else if (c == ":") {
            i = this.readQueryParameter(sb, query, i, parameterIndex++, map.parameterMap);
        } else {
            sb.append(query.charAt(i).toLowerCase());
        }
    }
    map.query = sb.toString();
    return map;
}

DataAccess.prototype.readQueryString = function(resultQuery, userQuery, charAtIndex) {
    resultQuery.append(c);
    var end = false;
    for (charAtIndex++; charAtIndex < userQuery.length; charAtIndex++) {
        if (userQuery.charAt(charAtIndex) == '\'' && !end) {
            end = true;
        } else if (end) {
            charAtIndex--;
            break;
        }
        resultQuery.append(userQuery.charAt(charAtIndex));
    }
    return charAtIndex;
}

DataAccess.prototype.readQueryParameter = function(resultQuery, userQuery, charAtIndex, parameterIndex, parameterMap) {
    var temp = Utils.String.createStringBuilder();
    for (charAtIndex++; charAtIndex < userQuery.length; charAtIndex++) {
        c = userQuery.charAt(charAtIndex);
        if (Utils.String.isIdentifierPart(c)) {
            temp.append(c);
        } else {
            break;
        }
    }
    temp = temp.toString().toUpperCase();
    resultQuery.append("?").append(c);
    var arr = parameterMap[temp];
    if (arr === undefined) {
        parameterMap[temp] = arr = new Array();
    }
    arr[arr.length] = parameterIndex;
    return charAtIndex;
}