
const ShippingAddress = require('../models/shippingAddmodel');


exports.createShippingAddress = async (req, res) => {
    try {
        const { user, fullName, phoneNumber, addressLine1, city, state, postalCode, country } = req.body;

        if (!fullName || !phoneNumber || !addressLine1 || !city || !state || !postalCode || !country) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const shippingAddress = new ShippingAddress({
            user: req.user.id,
            fullName,
            phoneNumber,
            addressLine1,
            addressLine2: req.body.addressLine2 || "",
            city,
            state,
            postalCode,
            country,
            isDefault: req.body.isDefault || false,
        });

        await shippingAddress.save();

        res.status(201).json({
            success: true,
            message: "Shipping address created successfully",
            shippingAddress,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getAllShippingAddresses = async (req, res) => {
    try {
        const addresses = await ShippingAddress.find({ user: req.user.id });

        res.status(200).json({
            success: true,
            addresses,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getShippingAddressById = async (req, res) => {
    try {
        const { addressId } = req.params;

        const address = await ShippingAddress.findOne({ _id: addressId, user: req.user.id });
        if (!address) {
            return res.status(404).json({ message: "Shipping address not found" });
        }

        res.status(200).json({
            success: true,
            address,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.updateShippingAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const updatedData = {
            fullName: req.body.fullName,
            phoneNumber: req.body.phoneNumber,
            addressLine1: req.body.addressLine1,
            addressLine2: req.body.addressLine2,
            city: req.body.city,
            state: req.body.state,
            postalCode: req.body.postalCode,
            country: req.body.country,
            isDefault: req.body.isDefault,
        };

        const address = await ShippingAddress.findOneAndUpdate(
            { _id: addressId, user: req.user.id },
            updatedData,
            { new: true } // Return the updated document
        );

        if (!address) {
            return res.status(404).json({ message: "Shipping address not found" });
        }

        res.status(200).json({
            success: true,
            message: "Shipping address updated successfully",
            address,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.deleteShippingAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const address = await ShippingAddress.findOneAndDelete({ _id: addressId, user: req.user.id });

        if (!address) {
            return res.status(404).json({ message: "Shipping address not found" });
        }

        res.status(200).json({
            success: true,
            message: "Shipping address deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
