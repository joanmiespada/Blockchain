var Web3 = require('web3'); // requires # https://github.com/ethereum/web3.js/blob/v1.0.0-beta.35
var fs = require('fs');

const web3 = new Web3()
const providerUrl = 'ws://localhost:8545' // requires # https://github.com/trufflesuite/ganache-cli/releases/tag/v7.0.0-beta.0
const provider = new Web3.providers.WebsocketProvider(providerUrl)
web3.eth.setProvider(provider)

web3.eth.getAccounts().then((res) => {
    console.log('eth.web3.accounts.wallet', res);

    code = fs.readFileSync('Voting.sol').toString()
    solc = require('solc')
    compiledCode = solc.compile(code)

    account = res[0]

    abiDefinition = JSON.parse(compiledCode.contracts[':Voting'].interface)
    byteCode = compiledCode.contracts[':Voting'].bytecode

    VotingContract = new web3.eth.Contract(abiDefinition,null, { from: account, gas: 4700000, data: byteCode } )

    var ss =VotingContract.deploy( {data: byteCode, arguments: [ 
        [web3.utils.fromAscii('Rama1'),
        web3.utils.fromAscii('Rama2'),
        web3.utils.fromAscii('Rama3'),
        web3.utils.fromAscii('Rama4'),
        web3.utils.fromAscii('Rama5'),
        ]  
    ]});

    var aux =  ss.send( {
        from: account,
        gas: 4700000,
        gasPrice: '3000000'
    });
    
    //console.log(aux)

    aux
    .on('error', function(error){ console.log(error)  })
    .on('transactionHash', function(transactionHash){ console.log( `transactionHash: ${transactionHash}`) })
    .on('receipt', function(receipt){
       console.log(`receipt.contractAddress: ${receipt.contractAddress}`) // contains the new contract address
    })
    .on('confirmation', function(confirmationNumber, receipt){ 
        console.log( `confirmationNumber: ${confirmationNumber}`); 
        console.log( `receipt ${receipt}`) 
    })
    .then((newContractInstance) =>{
        console.log(`newContractInstance.options.address: ${newContractInstance.options.address}`) // instance with the new contract address

        var voted=null;
        for(var i=0;i<25;i++)
        {
            var id = Math.floor((Math.random()*5)+1 );
            console.log(`voting for: Rama${id}`);
            voted = newContractInstance.methods.voteForCandidate( web3.utils.fromAscii(`Rama${id}`) )
                                                                .send({from: account } ) ;
        }
        voted.then( ()=>{
            console.log('votes for Rama2:...')
            var totalVotes = newContractInstance.methods.totalVotesFor( web3.utils.fromAscii('Rama2') )
                                                                    .call({from: account } ) ;

            totalVotes.then( res=> console.log(`${res}`) ).catch(console.log);
            console.log('Done!')

        }).catch(console.log);


    }).catch(console.log);

}).catch(console.log);
