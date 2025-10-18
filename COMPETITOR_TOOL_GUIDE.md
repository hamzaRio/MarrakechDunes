# 🏆 Competitor Tool Guide - MarrakechDunes

## **What is the Competitor Tool?**

The competitor tool is a **market intelligence system** that helps you price your activities competitively by comparing them with prices from other booking platforms like GetYourGuide and Rezdy.

## **🎯 How It Works**

### **1. Price Comparison Analysis**
When you view or add an activity, the system:

1. **Searches External APIs**: Queries GetYourGuide and Rezdy for similar activities
2. **Fetches Live Prices**: Gets real-time pricing data from competitors
3. **Displays Comparison**: Shows your price vs competitor prices
4. **Calculates Metrics**: 
   - **Profit Margin**: Your price - cost
   - **Market Position**: Competitive, Below market, Above market
   - **Client Savings**: How much customers save with you

### **2. Live Data Sources**

#### **GetYourGuide API**
- **Purpose**: Major tour booking platform
- **Data**: Live prices, ratings, reviews, duration
- **Coverage**: Morocco activities, desert tours, city tours
- **Status**: Currently having API parameter issues (400 errors)

#### **Rezdy API** 
- **Purpose**: Tour operator platform
- **Data**: Live prices, availability, descriptions
- **Coverage**: International tour operators
- **Status**: Working as fallback

#### **Mock Data**
- **Purpose**: Fallback when APIs fail
- **Data**: Curated Morocco activity prices
- **Coverage**: Desert tours, city tours, cultural activities
- **Status**: Always available

## **🔧 Current Issues & Solutions**

### **Issue 1: Non-Live GYG Prices**
**Problem**: Dashboard shows "1250 MAD" for GetYourGuide, but this is mock data, not live.

**Root Cause**: 
- GYG API returning 400 "Invalid request parameters"
- Account permissions may be insufficient
- API parameters need refinement

**Solution**: 
- ✅ Fixed API parameters (minimal approach)
- ✅ Added proper error handling
- ✅ Implemented fallback to mock data
- 🔄 **Next**: Verify GYG account has API access

### **Issue 2: Dark Mode Form Styling**
**Problem**: White dropdowns on dark background look inconsistent.

**Solution**: 
- ✅ Updated CSS to use `bg-background` instead of `bg-white`
- ✅ Added proper dark mode support for all form elements
- ✅ Fixed modal and dropdown styling

## **📊 How to Use the Competitor Tool**

### **In Admin Dashboard**
1. **View Activity**: Click on any activity in the dashboard
2. **See Price Analysis**: View "Price Comparison Analysis" section
3. **Compare Prices**: See your price vs GetYourGuide price
4. **Adjust Pricing**: Modify your price based on market data

### **In Add Activity Form**
1. **Search Competitors**: Use the search bar to find similar activities
2. **View Suggestions**: See competitor prices and details
3. **Auto-fill Data**: Click on suggestions to auto-fill form fields
4. **Set Competitive Price**: Use market data to price your activity

## **🎯 Benefits**

### **For Your Business**
- **Competitive Pricing**: Always know market rates
- **Profit Optimization**: Set prices that maximize profit
- **Market Intelligence**: Understand competitor strategies
- **Customer Value**: Show customers they're getting good deals

### **For Your Customers**
- **Transparency**: See how much they save with you
- **Trust**: Know you're offering competitive prices
- **Value**: Get the best deals on Morocco activities

## **🔧 Technical Implementation**

### **API Integration**
```typescript
// Search external activities
const activities = await searchExternalActivities(
  query: "agafay desert",
  city: "Marrakech", 
  provider: "all", // or "gyg", "rezdy"
  live: true // force live data
);
```

### **Price Comparison Logic**
```typescript
// Calculate market position
if (ourPrice < competitorPrice * 0.9) {
  position = "Below market";
} else if (ourPrice > competitorPrice * 1.1) {
  position = "Above market";
} else {
  position = "Competitive";
}
```

### **Fallback Strategy**
1. **Try Live APIs**: GetYourGuide → Rezdy
2. **Use Mock Data**: If APIs fail
3. **Show Status**: Indicate if data is live or mock

## **🚀 Next Steps**

### **Immediate Actions**
1. **Test GYG API**: Verify account has proper permissions
2. **Check Live Data**: Ensure prices are actually live
3. **Monitor Performance**: Track API success rates

### **Future Enhancements**
1. **More APIs**: Add TripAdvisor, Viator
2. **Price Alerts**: Notify when competitors change prices
3. **Trend Analysis**: Track price changes over time
4. **Automated Pricing**: Suggest optimal prices based on market data

## **❓ Troubleshooting**

### **If Prices Show as Mock Data**
- Check GYG API credentials in Render environment variables
- Verify account has API access enabled
- Check server logs for API errors

### **If Forms Look Wrong in Dark Mode**
- Clear browser cache
- Check if CSS changes are deployed
- Verify dark mode is properly enabled

### **If Competitor Search Returns No Results**
- Try different search terms
- Check if APIs are responding
- Verify network connectivity

---

**The competitor tool is designed to give you a competitive edge in the Morocco tour market by providing real-time market intelligence and helping you price your activities optimally.**
