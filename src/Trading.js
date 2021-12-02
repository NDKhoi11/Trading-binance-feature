import React, { useEffect, useState } from 'react';

import * as ccxt from 'ccxt';
import { enviroment } from './enviroment';
import { Autocomplete, Button, Container, TextField, FormControl, FormLabel, FormControlLabel, RadioGroup, Radio, Slider, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { NotificationContainer, NotificationManager } from 'react-notifications';
import 'react-notifications/lib/notifications.css';

import './style.css';
const { TelegramClient } = require('messaging-api-telegram');

const classes = {
	form: {
		border: '1px solid black',
		borderRadius: '5px',
		height: '500px',
		marginTop: '100px',
		display: 'flex',
		flexDirection: 'column',
		padding: '20px',
		backgroundColor: 'white'
	},
	background: {
		backgroundImage: 'url("https://public.bnbstatic.com/static/images/common/ogImage.jpg")',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center',
		backgroundSize: 'cover'
	}
};

const telegram = new TelegramClient({
  accessToken: enviroment.telegramKey,
});

const binance = new ccxt.binance({
	// proxy: 'https://example.com/',
	apiKey: enviroment.apiKey,
	secret: enviroment.secretKey,
	options: {
		defaultType: 'future'
	},
	enableRateLimit: true,
});

const Trading = () => {
	const [symbolList, setSymbolList] = useState([]);
	const [currentSymbol, setCurrentSymbol] = useState(null);
	const [currentSide, setCurrentSide] = useState('buy');
	const [currentMarginType, setCurrentMarginType] = useState('ISOLATED');
	const [currentLeverage, setCurrentLeverage] = useState(20);
	const [takeMoney, setTakeMoney] = useState('150');
	const [stopLoss, setStopLoss] = useState('');
	const [takeProfit, setTakeProfit] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		getSymbolList();
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (currentSymbol && !isLoading) {
			try {
				setIsLoading(true);
				const symbolInfo = await binance.fetchPositionsRisk([currentSymbol]);

				if (String(symbolInfo[0].info.leverage) !== currentLeverage) {
					await binance.setLeverage(currentLeverage, currentSymbol);
				}
				if (symbolInfo[0].info.marginType.toUpperCase() !== currentMarginType) {
					await binance.setMarginMode(currentMarginType, currentSymbol);
				}

				const AMOUNT = Math.floor((takeMoney * currentLeverage * 10) / symbolInfo[0].markPrice) / 10;

				const stopLostMoney = currentSide === 'buy' ? symbolInfo[0].markPrice - stopLoss / AMOUNT : symbolInfo[0].markPrice + stopLoss / AMOUNT;
				const takeProfitMoney = currentSide === 'buy' ? symbolInfo[0].markPrice + takeProfit / AMOUNT : symbolInfo[0].markPrice - takeProfit / AMOUNT;

				console.log(currentSymbol, AMOUNT)
				const order = await binance.createOrder(currentSymbol, 'market', currentSide, AMOUNT, undefined);

				const INVERTED_SIDE = currentSide === 'buy' ? 'sell' : 'buy';
				if (stopLoss) {
					const stopLossOrder = await binance.createOrder(currentSymbol, 'STOP_MARKET', INVERTED_SIDE, AMOUNT, undefined, { stopPrice: stopLostMoney });
				}
				if (takeProfit) {
					const takeProfitOrder = await binance.createOrder(currentSymbol, 'TAKE_PROFIT_MARKET', INVERTED_SIDE, AMOUNT, undefined, { stopPrice: takeProfitMoney });
				}
				setIsLoading(false);
				NotificationManager.success('Order Success', 'Create Order');
			} catch {
				setIsLoading(false);
				NotificationManager.error('Order Error', 'Create Order');
			}
		} else {
			if (!currentSymbol || !takeMoney) {
				NotificationManager.error('Please input information', 'Error');
			}
		}
	}

	const marks = function () {
		const result = [];
		for (let i = 0; i <= 50; i += 5) {
			if (!i) {
				result.push({ value: 1, label: '1' });
			} else {
				result.push({ value: i, label: `${i}` });
			}
		}
		return result;
	}();

	const listField = [
		{
			name: 'Take money',
			value: takeMoney,
			change: (e) => setTakeMoney(e.target.value)
		},
		{
			name: 'Stop loss money',
			value: stopLoss,
			change: (e) => setStopLoss(e.target.value)
		},
		{
			name: 'Take profit money',
			value: takeProfit,
			change: (e) => setTakeProfit(e.target.value)
		}
	];

	const getSymbolList = async () => {
		const markets = await binance.fetchMarkets();
		setSymbolList(markets.filter(symbol => symbol.quote === 'USDT').map(symbol => symbol.symbol));
	};

	const handleChangeSymbol = (e, value) => {
		setCurrentSymbol(value);
	};

	const handleChangeSide = (e) => {
		setCurrentSide(e.target.value);
	};

	const handleChangeMarginType = (e) => {
		setCurrentMarginType(e.target.value);
	};

	const handleChangeLeverage = (e) => {
		setCurrentLeverage(e.target.value);
	};

	const SubmitButton = () => {
		return (
			<Button
				variant="contained"
				size="small"
				type="submit"
				disabled={isLoading}
			>
				Start Trade
			</Button>
		);
	};

	return (
		<Box overflow="hidden" height="100vh" style={classes.background}>
			<NotificationContainer />
			<Container maxWidth="sm" style={{ overflow: 'hidden' }}>
				<form style={classes.form} onSubmit={handleSubmit}>
					<Box display="flex">
						<Autocomplete
							disablePortal
							id="combo-box-demo"
							options={symbolList}
							getOptionLabel={option => option}
							sx={{ width: 300 }}
							renderInput={(params) => <TextField {...params} label="Symbol (/USDT)" />}
							value={currentSymbol}
							onChange={handleChangeSymbol}
							blurOnSelect={true}
						/>
						<Box ml="20px" display="flex" alignItems="center">
							<SubmitButton />
						</Box>
					</Box>
					<Box mt="20px" display="flex" justifyContent="space-between">
						<Box>
							<FormControl component="fieldset">
								<FormLabel component="legend">
									<Typography color="black">{'Side'}</Typography>
								</FormLabel>
								<RadioGroup row name="row-radio-buttons-group" value={currentSide} onChange={handleChangeSide}>
									<FormControlLabel style={{ color: "green", fontWeight: '600 !important' }} value="buy" control={<Radio />} label="Buy" />
									<FormControlLabel style={{ color: "red", fontWeight: '600 !important' }} value="sell" control={<Radio />} label="Sell" />
								</RadioGroup>
							</FormControl>
						</Box>
						<Box>
							<FormControl component="fieldset">
								<FormLabel component="legend">
									<Typography color="black">{'Margin Type'}</Typography>
								</FormLabel>
								<RadioGroup row name="row-radio-buttons-group" value={currentMarginType} onChange={handleChangeMarginType}>
									<FormControlLabel style={{ color: "green", fontWeight: '600 !important' }} value="ISOLATED" control={<Radio />} label="Isolated" />
									<FormControlLabel style={{ color: "red", fontWeight: '600 !important' }} value="CROSSED" control={<Radio />} label="Cross" />
								</RadioGroup>
							</FormControl>
						</Box>
					</Box>
					<Box mt="10px">
						<Typography>{'Levarage'}</Typography>
						<Slider
							valueLabelDisplay="auto"
							step={null}
							marks={marks}
							value={currentLeverage}
							min={1}
							max={50}
							onChange={handleChangeLeverage}
							style={{ color: currentLeverage > 20 ? 'red' : '#1976d2' }}
						/>
					</Box>
					<Box>
						{listField.map((it, index) =>
							<Box key={index} mt="10px">
								<Typography>{it.name}</Typography>
								<TextField
									fullWidth={true}
									size="small"
									variant="outlined"
									value={it.value}
									onChange={it.change}
								/>
							</Box>
						)}
					</Box>
					<Box mt="20px" display="flex" justifyContent="flex-end">
						<SubmitButton />
					</Box>
				</form>
			</Container>
		</Box>
	);
}

export default Trading;
