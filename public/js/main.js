const url = new URL(window.location.href);

const rooms = ['Forsen', 'XQC', 'NymN', 'Pokelawls', 'Summit1G'];

// Check if queries exist
if (!(url.searchParams.get('username')) || !(url.searchParams.get('room'))) window.location.replace('/index.html');

window.addEventListener('load', () => {
    // Get username and room from URL
    const username = url.searchParams.get('username');
    const room = url.searchParams.get('room');

    const socket = io();

    const chatForm = document.getElementById('chat-form');
    const chatMessages = document.querySelector('.chat-messages');
    const roomName = document.getElementById('room-name');
    const usersList = document.getElementById('users');
    
    // Making sure you can't bypass username limits with manual queries
    if (username.length > 32 || username.length < 2) window.location.replace('/index.html');

    // Making sure you can't join any room with manual queries, only the ones from the array
    if (!rooms.includes(room)) window.location.replace('/index.html');

    // Join chatroom
    socket.emit('joinRoom', { username, room });

    // Get room and users
    socket.on('roomUsers', ({ room, users }) => {
        outputRoomName(room);
        outputRoomUsers(users);
    });

    // Message from server
    socket.on('message', (data) => {
        console.log(data);
        outputMessage(data);

        // Scroll down
        chatMessages.scrollTop = chatMessages.scrollHeight;
    })

    // Message submit
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let msg = e.target.elements.msg.value;

        // Limit message to 4000 characters
        msg = msg.substring(0, 4000);

        // Get message text
        socket.emit('chatMessage', msg);

        // Clear the input field after sending the message
        e.target.elements.msg.value = '';
        e.target.elements.msg.focus();
    })

    // Output message to DOM
    function outputMessage(message) {
        message.text = sanitizeHTML(message.text);
        message.username = sanitizeHTML(message.username)
        let metaClass = 'meta';
        if (message.username === "Server") {
            metaClass = 'meta-server';
        }
        const div = document.createElement('div');
        div.classList.add('message');
        console.log(metaClass);

        if (isImgLink(message.text)) {
            console.log('is image');

            // const date = Date.now();
            console.log(Date.now());
            const imageId = `${message.text}_${Date.now()}`;

            div.innerHTML = `<p class="${metaClass}">${message.username} <span class="time">${message.time}</span> <button id="hide_${imageId}" class="hideImg">Hide Image</button><button id="show_${imageId}" class="showImg">Show Image</button></p>
                             <img id="${imageId}" src="${message.text}" alt="Error: Couldn't load image." class="imgMsg">
                             <p id="hidden_text_${imageId}" class="imageHidden">${message.text}</p>`;
            chatMessages.appendChild(div);

            // Hide image
            document.getElementById(`hide_${imageId}`).addEventListener('click', () => {
                document.getElementById(`hidden_text_${imageId}`).style.display = 'block';
                document.getElementById(`${imageId}`).style.display = "none"; // Hide image
                document.getElementById(`show_${imageId}`).style.display = "inline"; // Show hide button
                document.getElementById(`hide_${imageId}`).style.display = "none"; // Hide show button
            })
            // Show image
            document.getElementById(`show_${imageId}`).addEventListener('click', () => {
                document.getElementById(`hidden_text_${imageId}`).style.display = 'none';
                document.getElementById(`${imageId}`).style.display = "inline";
                document.getElementById(`show_${imageId}`).style.display = "none"; // Hide show button
                document.getElementById(`hide_${imageId}`).style.display = "inline"; // Show hide button
            })
        }
        else {
            div.innerHTML = `<p class="${metaClass}">${message.username} <span>${message.time}</span></p>
                         <p class="text">${message.text}</p>`;
            chatMessages.appendChild(div);
        }
    }

    /*!
    * Sanitize and encode all HTML in a user-submitted string
    * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
    * @param  {String} str  The user-submitted string
    * @return {String} str  The sanitized string
    */
    function sanitizeHTML(str) {
        var temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    };

    // Add room name to DOM
    function outputRoomName(room) {
        roomName.innerText = room;
    }

    // Add users to DOM
    function outputRoomUsers(users) {
        usersList.innerHTML = `
            ${users.map(user => `<li>${sanitizeHTML(user.username)}</li>`).join('')}
        `;
    }

    // Check if message is an image url
    const isImgLink = (url) => {
        if (typeof url !== 'string') {
            return false;
        }
        return (url.match(/^http[^\?]*.(jpg|jpeg|gif|png|tiff|bmp)(\?(.*))?$/gmi) !== null);
    }

})