class ApiResponse {
    constructor(statusCode, data, message="Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export {ApiResponse};

//status_codes and meaning
//  code    meaning         statusCode (in api response) 
// 00–199	Informational   true                         
// 200–299	Successful	    true
// 300–399	Redirects	    true
// 400–499	Client errors	false // > 400 signifies errors
// 500–599	Server errors	false

