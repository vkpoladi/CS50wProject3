document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = function(event) {
    event.preventDefault();
    fetch('/emails', {
    method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => {
    return response.json()
    })
    .then(result => {
    console.log(result);
    load_mailbox('sent')
    })
    //Incase API is down or has issues
    .catch(error => {
        console.log('Error:', error);
    });
    //Not needed, but good practice
    return false;
    
  }
  
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show list of emails for the specific mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    // Declaring int (type) in for loop head causes error; not sure why
    for (i = 0; i < emails.length; i++) {
      element = document.createElement('div');
      element.className = 'email-item';
      element.style.border = "thick solid #0000FF";
      if (emails[i].read) {
        element.style.backgroundColor = "gray";
      } else {
        element.style.backgroundColor = "white";
      }

      element.innerHTML = emails[i].id + "\t" + emails[i].sender + "\t" + emails[i].subject + "\t" + emails[i].timestamp;

      // Store email id as data attribute to easily access later for API GET/PUT requests
      element.dataset.id = emails[i].id;
      //element.setAttribute('data-id', emails[i]);

      document.querySelector('#emails-view').append(element);
    }

    //Add event listener to all email divs
    document.querySelectorAll('.email-item').forEach(item => {
      item.onclick = () => {
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'none';
        document.querySelector('#single-email-view').style.display = 'block';
        
        // id from JSON gets converted to object when assigning to dataset value; Must convert back
        console.log(JSON.parse(item.dataset.id));

        //GET request from API for email contents/info
        fetch(`/emails/${JSON.parse(item.dataset.id)}`)
        .then(response => response.json())
        .then(email => {
          console.log(email);
          document.querySelector('#single-email-sender').innerHTML = email.sender;
          document.querySelector('#single-email-recipients').innerHTML = email.recipients;
          document.querySelector('#single-email-subject').innerHTML = email.subject;
          document.querySelector('#single-email-timestamp').innerHTML = email.timestamp;
          document.querySelector('#single-email-body').innerHTML = email.body;

          //Implement archive/unarchive button
          let archived = email.archived;
          button = document.querySelector('#archiveButton');
          if (archived) {
            button.setAttribute('value', 'Unarchive');
            button.innerHTML = 'Unarchive';
          } else {
            button.setAttribute('value', 'Archive');
            button.innerHTML = 'Archive';
          }

          button.onclick = () => {
            fetch(`/emails/${JSON.parse(item.dataset.id)}`, {
              method: 'PUT',
              body:JSON.stringify({
                archived: !email.archived
              })
            })

            load_mailbox('inbox');
            //Reload page to see email change between mailboxes
            location.reload();
          }

        })

        //PUT request to API for changing read status
        fetch(`/emails/${JSON.parse(item.dataset.id)}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        })
        
      }
    })

  })
  .catch(error => {
    console.log('Error:', error);
  });
  return false;


}