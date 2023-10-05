import { useEffect, useRef, useState } from "react";
import Message from "./Components/Message";
import { app } from "./Components/firebase";
import {
  Box,
  HStack,
  Container,
  VStack,
  Button,
  Input,
} from "@chakra-ui/react";
import {
  onAuthStateChanged,
  signOut,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

const logoutHandler = () => signOut(auth);
const loginHandler = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider);
};
function App() {
  const [user, setUser] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const divForScroll = useRef();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      setMessage("");
      await addDoc(collection(db, "Message"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp(),
      });
      divForScroll.current.scrollIntoView({ behaviour: "smooth" });
    } catch (error) {
      alert(error);
    }
  };
  useEffect(() => {
    const unSubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data);
    });
    const unSubscribeForMessage = onSnapshot(
      query(collection(db, "Message"), orderBy("createdAt", "asc")),
      (snap) =>
        setMessages(
          snap.docs.map((item) => {
            const id = item.id;
            return { id, ...item.data() };
          })
        )
    );
    // });
    return () => {
      unSubscribe();
      unSubscribeForMessage();
    };
  }, []);
  return (
    <Box bg={"cyan.50"}>
      {user ? (
        <Container h={"100vh"} bg={"white"}>
          <VStack h={"full"} paddingY={1}>
            <Button onClick={logoutHandler} colorScheme={"blue"} w={"full"}>
              LogOut
            </Button>
            <VStack
              h={"full"}
              w={"full"}
              overflowY="auto"
              css={{
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              {messages.map((item) => (
                <Message
                  key={item.id}
                  user={item.uid === user.uid ? "me" : "other"}
                  text={item.text}
                  uri={item.uri}
                />
              ))}
              <div ref={divForScroll}></div>
            </VStack>
            <form
              onSubmit={submitHandler}
              style={{
                width: "100%",
              }}
            >
              <HStack>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mesage"
                />
                <Button colorScheme={"blue"} type={"submit"}>
                  {" "}
                  Send
                </Button>
              </HStack>
            </form>
          </VStack>
        </Container>
      ) : (
        <VStack bg={"white"} h={"100vh"} justifyContent={"center"}>
          <Button onClick={loginHandler} colorScheme="blue">
            Sign In with Google
          </Button>
        </VStack>
      )}
    </Box>
  );
}
export default App;
