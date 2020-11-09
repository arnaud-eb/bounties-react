import React, { Component } from "react";
import BountiesContract from "./contracts/Bounties.json";
import getWeb3 from "./getWeb3";
import { setJSON, getJSON } from "./IPFS.js";

import { Loader } from "rimble-ui"; 
import { Form, Button, Container, Row, Card } from "react-bootstrap";
import BootstrapTable from "react-bootstrap-table-next";

import "./App.css";

const etherscanBaseUrl = "https://rinkeby.etherscan.io";
const ipfsBaseUrl = "https://ipfs.infura.io/ipfs";
const columns = [{ 
  dataField: 'bounty_id', 
  text: 'ID',
  sort: true
},
{ 
  dataField: 'issuer', 
  text: 'Issuer'
},
{ 
  dataField: 'amount', 
  text: 'Amount'
},
{ 
  dataField: 'bountyData', 
  text: 'Bounty Data'
},
{ 
  dataField: 'ipfsData', 
  text: 'Bounty Data'
}];
const defaultSorted = [{
  dataField: 'bounty_id',
  order: 'asc' 
}];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      web3: null, 
      account: null, 
      bountiesInstance: undefined,
      etherscanLink: "https://rinkeby.etherscan.io",
      bountyData: undefined,
      bountyDeadline: undefined,
      bountyAmount: undefined,
      bounties: []
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleIssueBounty = this.handleIssueBounty.bind(this);
    this.setLastTransactionDetails = this.setLastTransactionDetails.bind(this);
    // this.addEventListener = this.addEventListener.bind(this);
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = BountiesContract.networks[networkId];
      const instance = new web3.eth.Contract(
        BountiesContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3: web3, account: accounts[0], bountiesInstance: instance });
      this.addEventListener(this);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  }

  addEventListener(component) {
    const bountiesInstance = this.state.bountiesInstance;
    bountiesInstance.getPastEvents("BountyIssued", {
      fromBlock: 0, 
      toBlock: "latest"
    }, function(err, events) {
      if(!err) {
        for(var event of events) {
          component.getIssuedBounty(event, component);
          // var ipfsJson = {};
          // try {
          //   ipfsJson = await getJSON(event.returnValues.data);
          // } catch(error) {
          //   console.log(error);
          // }
          // if(ipfsJson.bountyData !== undefined) {
          //   event.returnValues['bountyData'] = ipfsJson.bountyData;
          //   event.returnValues['ipfsData'] = ipfsBaseUrl+"/"+event.returnValues.data;
          // } else {
          //   event.returnValues['bountyData'] = event.returnValues.data;
          //   event.returnValues['ipfsData'] = "none";
          // }
          // component.setState(state => ({
          //   bounties: state.bounties.concat([event.returnValues])
          // }));
        }
      }
    });
    bountiesInstance.events.BountyIssued({ fromBlock: 0 })
    .on("data", (event) => {
      component.getIssuedBounty(event, component);
      // var ipfsJson = {};
      // try {
      //   ipfsJson = await getJSON(event.returnValues.data);
      // } catch(error) {
      //   console.log(error);
      // }
      // if(ipfsJson.bountyData !== undefined) {
      //   event.returnValues['bountyData'] = ipfsJson.bountyData;
      //   event.returnValues['ipfsData'] = ipfsBaseUrl+"/"+event.returnValues.data;
      // } else {
      //   event.returnValues['bountyData'] = event.returnValues.data;
      //   event.returnValues['ipfsData'] = "none";
      // }
      // component.setState(state => ({
      //   bounties: state.bounties.concat([event.returnValues])
      // }));
    })
    .on("error", console.log);
  }

  //handle form data change
  handleChange(event) {
    switch(event.target.name) {
      case "bountyData":
        this.setState({ bountyData: event.target.value });
        break;
      case "bountyDeadline":
        this.setState({ bountyDeadline: event.target.value });
        break;
      case "bountyAmount":
        this.setState({ bountyAmount: event.target.value });
        break;
      default:
        break;
    }
  }

  handleIssueBounty(event) {
    const { bountiesInstance, account, web3, bountyData, bountyDeadline, bountyAmount } = this.state;
    if(typeof bountiesInstance !== "undefined") {
      event.preventDefault();
      setJSON({bountyData: bountyData})
      .then(hash => {
        bountiesInstance.methods.issueBounty(hash, parseInt(Date.parse(bountyDeadline))).send({from: account, value: web3.utils.toWei(bountyAmount)})
        .on("transactionHash", this.setLastTransactionDetails)
        .on("error", console.log)
      })
      .catch(console.log);
    }
  }

  setLastTransactionDetails(txHash) {
    if(typeof txHash !== "undefined") {
      this.setState({ etherscanLink: etherscanBaseUrl+"/tx/"+txHash });
    } else {
      this.setState({ etherscanLink: etherscanBaseUrl });
    }
  }

  async getIssuedBounty(event, component) {
    var ipfsJson = {};
    try {
      ipfsJson = await getJSON(event.returnValues.data);
    } catch(error) {
      console.log(error);
    }
    if(ipfsJson.bountyData !== undefined) {
      event.returnValues['bountyData'] = ipfsJson.bountyData;
      event.returnValues['ipfsData'] = ipfsBaseUrl+"/"+event.returnValues.data;
    } else {
      event.returnValues['bountyData'] = event.returnValues.data;
      event.returnValues['ipfsData'] = "none";
    }
    component.setState(state => ({
      bounties: state.bounties.concat([event.returnValues])
    }));
  }

  render() {
    if (!this.state.web3) {
      return <Loader color="black" size="80px"/>;
    }
    return (
      <div className="App">
        <Container>
          <Row className="row">
            <a href={this.state.etherscanLink} target="_blank" rel="noopener noreferrer">Last Transaction Details</a>
          </Row>
          <Row className="row">
            <Card bg="dark" text="white" border="primary" style={{width: "100%"}}> 
              <Card.Header>Issue Bounty</Card.Header>
              <Card.Body>  
                <Form onSubmit={this.handleIssueBounty}>
                  <Form.Group controlId="formBountyData">
                    <Form.Label>Enter Bounty Data</Form.Label>
                    <Form.Control as="textarea" placeholder="Enter Bounty Details" name="bountyData" value={this.state.bountyData} onChange={this.handleChange} />
                  </Form.Group>
                  <Form.Group controlId="formBountyDeadline">
                    <Form.Label>Enter Bounty Deadline</Form.Label>
                    <Form.Control type="datetime-local" name="bountyDeadline" value={this.state.bountyDeadline} onChange={this.handleChange} />
                  </Form.Group>
                  <Form.Group controlId="formBountyAmount">
                    <Form.Label>Enter Bounty Amount</Form.Label>
                    <Form.Control type="text" placeholder="Enter Bounty Amount" name="bountyAmount" value={this.state.bountyAmount} onChange={this.handleChange} />
                  </Form.Group>
                  <Button type="submit">Issue Bounty</Button>
                </Form>
              </Card.Body>
            </Card>
          </Row>
          <Row className="row">
            <Card>
              <Card.Header>Issued Bounties</Card.Header>
              <Card.Body>
                <BootstrapTable striped hover keyField="bounty_id" data={this.state.bounties} columns={columns} defaultSorted={defaultSorted}/>
              </Card.Body>
            </Card>
          </Row>
        </Container> 
      </div>
    );
  }
}

export default App;
