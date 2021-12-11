const socket = io();

//! HTML
const $messageForm = document.querySelector("#message-form");
const $textMessage = document.querySelector("#text-message");
const $sendBtn = document.querySelector("#send-btn");
const $locationBtn = document.querySelector("#location-btn");
const $viewMessage = document.querySelector("#message");

//! TEMPLATES
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const userBroadcastTemplate = document.querySelector("#user-broadcast-template").innerHTML;
const usersListTemplate = document.querySelector("#users-list-template").innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

//> Join Room 
socket.emit("joinRoom", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});

// > Welcome Message
socket.on('welcomeMessage', (message) => {
    document.querySelector("#welcome-message").innerHTML = message.text;
});

//> Sending Message
$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    console.log($textMessage.value);
    socket.emit("sendMessage", $textMessage.value, (response) => {
        //! response from server 
        console.log(response);
    });
    $textMessage.value = "";
    $textMessage.focus();

});

//> Sharing Location
$locationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.");
    }

    $locationBtn.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("sendLocation", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (response) => {
            console.log(response);
        });
    })
});

//> Rendering Message
socket.on("message", (message) => {
    console.log(message.text);
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm A')
    });
    $viewMessage.insertAdjacentHTML("beforeend", html);
});

//> Render Location Message
socket.on("location", (message) => {
    const html = Mustache.render(locationTemplate, {
        url: message.url,
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm A')
    });
    $viewMessage.insertAdjacentHTML("beforeend", html);

    setTimeout(() => {
        $locationBtn.removeAttribute("disabled");
    }, 1000);
})

//> Render All User in Room
socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(usersListTemplate, {
        room,
        users
    });
    document.querySelector("#user-list-div").innerHTML = html

})

//> Broadcast New User
socket.on("userBroadcast", (message) => {
    const html = Mustache.render(userBroadcastTemplate, {
        message: message.text
    });
    $viewMessage.insertAdjacentHTML("beforeend", html);
})

