const fs = require("fs");
const solc = require('solc');
const ganache = require('ganache-cli');
let Web3 = require('web3');

let web3 = new Web3();
web3.setProvider(ganache.provider());

const CommunityJson = require('../ethereum/build/Community.json');

let Community = {
    interface: JSON.parse(CommunityJson.interface),
    bytecode: '0x' + CommunityJson.bytecode,
    gasEstimate: '6000000'
};

let deploy = async () => {
    let accounts = await web3.eth.getAccounts();

    let contract = await new web3.eth.Contract(JSON.parse(abi))
    .deploy({ data: bytecode, arguments: ["Skyllz", "Skyllz", "SKVT"] })
    .send({ from: accounts[0], gas: '6000000' });
};

deploy();