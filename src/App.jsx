import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [waveCount, setWaveCount] = useState(0);
  const [allWaves, setAllWaves] = useState([]);
  const [ethSays, setEthSays] = useState("Ethereum says...");
  const [errorMessage, setErrorMessage] = useState("");
  const contractAddress = "0xb4187463D15fC232E2D48EAa7fc469E4131e940a";
  const contractABI = abi.abi;


  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await wavePortalContract.getAllWaves();

        //let wavesCleaned = waves.map(wave => {
        let wavesCleaned = waves.slice(0).reverse().map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          }
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method hee
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    if(Message.value.length > 0){
      setErrorMessage('');
      try {
        const { ethereum } = window;
        

        if (ethereum) {
          
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

          let count = await wavePortalContract.getTotalWaves();
          console.log("Retrieved total wave count...", count.toNumber());

          /*
          * Execute the actual wave from your smart contract
          */
          const waveTxn = await wavePortalContract.wave(Message.value, { gasLimit: 300000 });
          console.log("Mining...", waveTxn.hash);

          setEthSays(`Mining block ${waveTxn.hash}`);

          await waveTxn.wait();
          console.log("Mined -- ", waveTxn.hash);

          setEthSays(`Mined block ${waveTxn.hash}`);

          count = await wavePortalContract.getTotalWaves();
          waveCounter();
          console.log("Retrieved total wave count...", count.toNumber());
          setEthSays(`Block retrieved, updating UI...`);

          setTimeout(()=>{
            setEthSays(`Ethereum says...`);
          },1500);

          //window.location.reload(false);
        } else {
          console.log("Ethereum object doesn't exist!");
        }
      } catch (error) {
        console.log(error)
      }
    }else{
      setErrorMessage('Please enter a message!');
    }
     

  }

  const waveCounter = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        setWaveCount(count.toNumber());

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }



  /**
   * Listen in for emitter events!
   */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        }
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  useEffect(() => {
    checkIfWalletIsConnected();
    getAllWaves();
    waveCounter();

  }, [])

  return (
    
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>
        <div className="bio">
        I am Jason, I like to build things and learn about new tech! Connect your Ethereum wallet to 
        see the thread and wave at me!
        </div>

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {currentAccount && (
          <div>
            <div className="ethMsg">{ethSays}</div>
            <textarea id="Message"></textarea>
            <div className="errorMsg">{errorMessage}</div>
            <button className="waveButton" onClick={wave}>
              Wave at Me 
            </button>
            
            <strong>{waveCount}</strong> waves have been written to the blockchain!
          </div>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div className="msg" key={index}>
              <a href={'https://rinkeby.etherscan.io/address/' + wave.address} target="_blank" rel="noopener noreferrer" className="mono">Wave from: {wave.address}</a>
              <div className="mono">{wave.timestamp.toString()}</div>
              <div className="msgText">{wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}

export default App