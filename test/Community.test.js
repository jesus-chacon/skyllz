require('events').EventEmitter.prototype._maxListeners = 30;

const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const CommunityJson = require('../ethereum/build/Community.json');

let Community = {
    interface: JSON.parse(CommunityJson.interface),
    bytecode: CommunityJson.bytecode,
    gasEstimate: '6000000'
};

let addresses = {
    manager: '',
    community: '',
    votingToken: '',
    partner: { wallet: '', factory: '' },
    student: { wallet: '', uct: '' },
    rater: { wallet: '' }
};

let staticCommunity = {
    contract: '',
    address: ''
};

beforeEach(async () => {
    let accounts = await web3.eth.getAccounts();

    addresses.manager = accounts[0];
    addresses.partner.wallet = accounts[1];
    addresses.student.wallet = accounts[2];
    addresses.rater.wallet = accounts[3];

    Community.contract = await new web3.eth.Contract(Community.interface)
    .deploy({ data: Community.bytecode, arguments: ["Skyllz", "Skyllz Voting Token", "SVT"] })
    .send({ from: addresses.manager, gas: '6000000' });

    addresses.community = Community.contract.options.address;
    addresses.votingToken = await Community.contract.methods.voteToken().call();
});

describe('Community contract', () => {
    it('Deploy', () => {
        assert.ok(Community.contract.options.address);
        assert.ok(addresses.votingToken);
    });

    it('Sender is the manager', async () => {
        let manager = await Community.contract.methods.manager().call();

        assert.equal(manager, addresses.manager);
    });

    it('Manager is a partner', async () => {
        let isPartner = await Community.contract.methods.isPartner(addresses.manager).call();

        assert.ok(isPartner);
    });

    it('Can apply to partner', async () => {
        let totalApplications = await Community.contract.methods.totalApplications().call();
        assert.equal(0, totalApplications);

        await Community.contract.methods.createApplication().send({ from: addresses.partner.wallet, gas: "1000000" });

        totalApplications = await Community.contract.methods.totalApplications().call();
        assert.equal(1, totalApplications);
    });

    it('Can activate the voting system in a Application', async () => {
        await Community.contract.methods.createApplication().send({ from: addresses.partner.wallet, gas: "1000000" });

        let application = await Community.contract.methods.applications(0).call();

        assert(!application.isActive);

        await Community.contract.methods.enableApplication(0).send({ from: addresses.manager, gas: '1000000' });

        application = await Community.contract.methods.applications(0).call();

        assert(application.isActive);
    });

    it('Only actived partners can vote in application', async () => {
        staticCommunity = {
            contract: Community.contract,
            address: addresses.community
        };

        await staticCommunity.contract.methods.createApplication().send({ from: addresses.partner.wallet, gas: '1000000' });
        await staticCommunity.contract.methods.enableApplication(0).send({ from: addresses.manager, gas: '1000000' });

        try {
            await staticCommunity.contract.methods.voteInApplication(0, true).send({ from: addresses.partner.wallet, gas: '1000000' });
            assert(false);
        } catch (e) {
            assert(true);
        }

        let application = await staticCommunity.contract.methods.applications(0).call();

        assert.equal(application.totalVotes, 0);

        await staticCommunity.contract.methods.voteInApplication(0, true).send({ from: addresses.manager, gas: '1000000' });

        application = await staticCommunity.contract.methods.applications(0).call();

        assert.equal(application.totalVotes, 1);
        assert.equal(application.votes, 1);
    });

    it('The application close properly (Good)', async () => {
        await staticCommunity.contract.methods.closeApplication(0);

        let isPartner = await staticCommunity.contract.methods.isPartner(addresses.partner.wallet);

        assert(isPartner);
    });
});