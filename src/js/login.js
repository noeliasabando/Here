function loginFacebook(){
  const provider = new firebase.auth.FacebookAuthProvider();
  //provider.addScope('user_birthday'); // tienen que pedir permiso a facebook
  provider.setCustomParameters({
    'display':'popup'

  });
  firebase.auth().signInWithPopup(provider)
  .then(()=> {
    console.log('login con Face');
    window.location.href = 'src/html/mapa.html';
    
  })
  .catch((error)=> {
    console.log('Error de firebase >'+error.code);
    console.log('error de firebase, mensaje >'+error.mensaje);
    
  });
}

function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({
    'display': 'popup'
  });
  firebase.auth().signInWithPopup(provider)
    .then(()=> {
      console.log('Login con Google');
      window.location.href = 'src/html/mapa.html';
    })
    .catch((error) => {
      console.log('Error de Firebase > ' + error.code);
      console.log('Error de Firebase, mensaje > ' + error.message);
    });
}



const register = () => {
  const emailValue = email.value;
  const passwordValue = password.value;
  firebase.auth().createUserWithEmailAndPassword(emailValue, passwordValue)
  .then(() => {
    console.log('usuario registrado');
    window.location.href = 'src/html/mapa.html';
  })
  .catch((error) => {
    console.log('Error firebase>' + error.code);
    console.log('Error Firebase>' + error.mensaje);
  })
};

const login = () => {
  const emailValue = document.getElementById('email').value;
  const passwordValue = document.getElementById('password').value;
  firebase.auth().signInWithEmailAndPassword(emailValue, passwordValue)
  .then(() => {
    console.log('Usuario Logeado');
    window.location.href = 'src/html/mapa.html';
    
  })
  .catch(()=> {
    console.log('Error de firebase' + error.code);
    console.log('Error de firebase' + error.mensaje);
  })
};

const logOut = () => {
  firebase.auth().signOut()
  .then(() => {
    console.log('Usuario deslogeado');
  })
  .catch();
};

