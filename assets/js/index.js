function ExpertSearchController() {
    var self = this;

    self.data = {
        Users: {},
        Friendships: {},
        UserData: {},
        CurrentProfile: {},
    }

    self.templates = {
        directory: {
            contents: $('#template-directory-contents').html(),
        },
        profile: $('#template-user-profile').html(),
        modal: $('#template-expert-search-modal').html(),
        manage_friendships: $('#template-manage-friendships').html(),
        create_user: $('#template-create-user').html(),
    }

    self.elements = {
        content: {
            all: $('#content .d-none'),
            landing_page: $('#landing-page'),
        },
        navbar: {
            brand: $('#navbar-brand'),
            context: $('#navbar .nav-context'),
            collapse: $('#navbar .nav-actions'),
            home: $('#nav-home'),
            friend: $('#nav-friend'),
            create: $('#nav-create'),
            title: $('#navbar h3'),
        },
        placeholder: {
            directory_contents: $('#directory-contents'),
            expert_profile: $('#expert-profile'),
            modal: $('#modal-placeholder'),
            manage_friendships: $('#manage-friendships'),
            create_user: $('#create-user'),
        },
        profile: {
            form_expert_search: $('#form-expert-search'),
        }

    }

    self.init = function() {
        $('body').scrollspy({ target: '#directory-list' })
        self.elements.navbar.home.on('click', function(el) {
            el.preventDefault()
            self.elements.placeholder.expert_profile.addClass('d-none')
            self.elements.placeholder.create_user.addClass('d-none')
            self.elements.placeholder.manage_friendships.addClass('d-none')
            self.elements.placeholder.directory_contents.removeClass('d-none')
        })
        self.elements.navbar.friend.on('click', function(el) {
            el.preventDefault()
            self.render.manage_friendships()
        })
        self.elements.navbar.create.on('click', function(el) {
            el.preventDefault()
            self.render.create_user()
        })
        $(document).on('submit', '#form-expert-search', function (el) {
            el.preventDefault()
            self.func.ExpertSearch($(this))
        })
        $(document).on('submit', '#form-manage-friendships', function (el) {
            el.preventDefault()
            self.func.CreateFriendship($(this))
        })
        $(document).on('submit', '#form-create-user', function (el) {
            el.preventDefault()
            self.func.CreateUser($(this))
        })
        $(document).on('click', '#form-expert-search-results', function (el) {
            el.preventDefault()
            button = $(this)
            json = {data: {attributes: {user_id: button.data('user'), friend_id: button.data('friend')}}}
            self.queue.Push({
                type: "post",
                dataType: 'json',
                data: JSON.stringify(json),
                url: self.helpers.url(button.data('action')),
                success: function (data, textStatus, xhr) { 
                    console.log(data)
                    setTimeout(() => {self.func.VisitUserProfile(button)}, 200);
                },
                error: function (xhr){
                    console.log(xhr)
                }
            });
        });
        self.func.Initialize()
    }

    self.func = {}
    self.func.Initialize = function() {
        self.func.GetUsers()
    }

    self.func.GetUsers = function() {
        self.queue.Push({
            type: 'GET',
            url: self.helpers.url('/users'),
            dataType: 'json',
            success: function (data, textStatus, xhr) {
                self.data.Users = {}

                for (var i in data['data']) {
                    key = data['data'][i]['id']
                    self.data.Users[key] = data['data'][i]['attributes']
                }
                setTimeout(() => {self.func.GetUserData()}, 200);
            },
            error: function (xhr){
                console.log(xhr)
            }
        });
    }

    self.func.GetUserData = function() {
        self.data.UserData = {}
        for (var id in self.data.Users) {
            self.queue.Push({
                type: 'GET',
                url: self.helpers.url('/users/' + id + '/userdata'),
                dataType: 'json',
                success: function (data, textStatus, xhr) {
                    for (var i in data['data']) {
                        uid = data['data'][i]['attributes']['user_id']
                        if (uid != '' && undefined != uid) {
                            if (!(uid in self.data.UserData)) {
                                self.data.UserData[uid] = []
                            }
                            self.data.UserData[uid].push(data['data'][i]['attributes'])
                        }
                    }
                    setTimeout(() => {self.render.directory_contents()}, 200);
                },
                error: function (xhr){
                    console.log(xhr)
                }
            });
        }
    }

    self.func.VisitUserProfile = function(link) {
        user_id = link.data('key')
        if (undefined === user_id) {
            user_id = self.data.CurrentProfile['user_id']
        }
        action = link.attr('href')
        if (undefined === user_id) {
            action = link.data('action')
        }
        self.queue.Push({
            type: 'GET',
            url: self.helpers.url('/users/'+user_id+'/friends'),
            dataType: 'json',
            success: function (data, textStatus, xhr) {
                console.log(data)
                self.data.Friendships = {}
                for (var i in data['data']) {
                    key = data['data'][i]['id']
                    self.data.Friendships[key] = data['data'][i]['attributes']
                }
            },
            error: function (xhr){
                console.log(xhr)
            }
        });
         self.queue.Push({
            type: 'GET',
            url: self.helpers.url(action),
            dataType: 'json',
            success: function (data, textStatus, xhr) {
                self.data.CurrentProfile = data['data']['attributes']
                self.data.CurrentProfile['user_id'] = user_id
            },
            error: function (xhr){
                console.log(xhr)
            },
            complete: function (xhr, textStatus) {
                setTimeout(() => {self.render.expert_profile()}, 200);
            }
        });
    }

    self.func.ExpertSearch = function(form) {
        user_id = self.data.CurrentProfile['user_id']
        form_data = self.helpers.toObject(form.serializeArray())
        terms_array = form_data['search-terms'].split(" ")
        terms = ""
        for (var term in terms_array) {
            terms += "terms[]="+terms_array[term]+"&"
        }
        terms = terms.slice(0,-1)
        console.log(terms)
        self.queue.Push({
            type: 'GET',
            url: self.helpers.url('/users/' + user_id + '/expert_search?'+terms),
            dataType: 'json',
            success: function (data, textStatus, xhr) {
                flat_data = data['data']['attributes']
                flat_data['user_id'] = self.data.CurrentProfile['user_id']
                setTimeout(() => {self.render.modal(flat_data)}, 100);
            },
            error: function (xhr){
                console.log(xhr)
            }
        });
    }

    self.func.CreateFriendship = function(form) {
        form_data = self.helpers.toObject(form.serializeArray())
        console.log(form_data)
        json = {data: {attributes: {user_id: form_data['friend1'], friend_id:form_data['friend2']}}}
        self.queue.Push({
            type: form.attr('method'),
            dataType: 'json',
            data: JSON.stringify(json),
            url: self.helpers.url(form.attr('action')+form_data['friend1']+"/friends"),
            success: function (data, textStatus, xhr) { 
                console.log(data)
                $('#manage-friendship-success-box').html("Successfully created friendship: " + JSON.stringify(xhr)).show()
                setTimeout(() => {$('#manage-friendship-success-box').hide()}, 5000);
            },
            error: function (xhr){
                console.log(xhr)
                data = xhr.responseText
                d = JSON.parse(data)
                $('#manage-friendship-error-box').html("Failed to create friendship: " + d['errors'][0]['detail']).show()
                setTimeout(() => {$('#manage-friendship-error-box').hide()}, 5000);
            }
        });
    }

    self.func.CreateUser = function(form) {
        form_data = self.helpers.toObject(form.serializeArray())
        console.log(form_data)
        json = {data: {attributes: {first_name: form_data['first-name'], last_name:form_data['last-name'], website:form_data['website']}}}
        self.queue.Push({
            type: form.attr('method'),
            dataType: 'json',
            data: JSON.stringify(json),
            url: self.helpers.url(form.attr('action')),
            success: function (data, textStatus, xhr) { 
                console.log(data)
                $('#create-user-success-box').html("Successfully created user: " + JSON.stringify(xhr)).show()
                setTimeout(() => {$('#create-user-success-box').hide()}, 5000);
                setTimeout(() => {self.func.GetUsers()}, 200)
            },
            error: function (xhr){
                console.log(xhr)
                data = xhr.responseText
                d = JSON.parse(data)
                $('#create-user-error-box').html("Failed to create user: " + d['errors'][0]['detail']).show()
                setTimeout(() => {$('#create-user-error-box').hide()}, 5000);
            }
        });
    }

    self.render = {}
    self.render.Initialize = function () {
    }

    self.render.directory_contents = function() {
        self.elements.placeholder.directory_contents.html(_.template(self.templates.directory.contents)({'users': self.data.Users, 'user_data': self.data.UserData, 'self':self}))
        self.elements.placeholder.directory_contents.find('a.visit-user-profile').on('click', function(el) {
            el.preventDefault()
            self.func.VisitUserProfile($(this))
        })
    }

    self.render.expert_profile = function() {
        self.elements.placeholder.expert_profile.html(_.template(self.templates.profile)({'users': self.data.Users, 'user_data': self.data.UserData, 'friends': self.data.Friendships, 'profile': self.data.CurrentProfile, 'self':self}))
        self.elements.placeholder.expert_profile.removeClass('d-none')
        self.elements.placeholder.directory_contents.addClass('d-none')
        self.elements.placeholder.manage_friendships.addClass('d-none')
        self.elements.placeholder.create_user.addClass('d-none')
        self.elements.placeholder.expert_profile.find('a.visit-friend-profile').on('click', function(el) {
            el.preventDefault()
            self.func.VisitUserProfile($(this))
        })
    }

    self.render.modal = function(attrs) {
        self.elements.placeholder.modal.html(_.template(self.templates.modal)({'attrs':attrs, 'self':self}))
        $('#search-results-modal').modal('show')
    }

    self.render.manage_friendships = function() {
        self.elements.placeholder.manage_friendships.html(_.template(self.templates.manage_friendships)({'users': self.data.Users, 'self':self}))
        self.elements.placeholder.expert_profile.addClass('d-none')
        self.elements.placeholder.directory_contents.addClass('d-none')
        self.elements.placeholder.create_user.addClass('d-none')
        self.elements.placeholder.manage_friendships.removeClass('d-none')
    }

    self.render.create_user = function() {
        self.elements.placeholder.create_user.html(_.template(self.templates.create_user)({'self':self}))
        self.elements.placeholder.expert_profile.addClass('d-none')
        self.elements.placeholder.directory_contents.addClass('d-none')
        self.elements.placeholder.manage_friendships.addClass('d-none')
        self.elements.placeholder.create_user.removeClass('d-none')
    }

    self.helpers.parseAPIUserData = function() {
        result = {}
        for (var id in self.data.Users) {
            name = self.data.Users[id]['first_name'] + ' ' + self.data.Users[id]['last_name']
            result[id] = name.trim()
        }
        return result
    }

    self.init()
};

ExpertSearchController.prototype = new BaseController();

var c = new ExpertSearchController();
