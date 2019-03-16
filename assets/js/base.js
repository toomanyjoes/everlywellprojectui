function BaseController() {
    var self = this;

    self.queue = new AjaxQueue()

    //self.host = "http://localhost:3000"
    self.host = "https://everlywellproject-api.herokuapp.com"

    self.helpers = {}
    self.helpers.url = function(uri) {
        return self.host + uri;
    }
    self.helpers.toObject = function(formArray) {
        obj = {}
        for (var i=0; i < formArray.length; i++) {
            field = formArray[i]
            obj[field.name] = field.value
        }
        return obj
    }
};

debug = console.log
