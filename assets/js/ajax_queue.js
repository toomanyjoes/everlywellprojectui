var AjaxQueue = function() {
    var self = this;

    self._requests = []
    self._timeoutID = ''

    self.Push = function(options) {
        options.contentType = "application/json; charset=utf-8"
        self._requests.push(options)
    }

    self.run = function() {
        if (self._requests.length == 0) {
            self._timeoutID = setTimeout(function() { self.run() }, 100);
            return
        }
        $.ajax(self._requests.shift()).then(self.run, self.run)
    }

    self.stop =  function() {
        requests = [];
        clearTimeout(self._timeoutID);
    }


    self.run()
    return self
}
