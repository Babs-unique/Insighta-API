const checkVersion = async (req, res, next) => {
    if (req.path.includes('/auth/')) {
        return next(); 
    }
    const apiVersion = req.headers['x-api-version'];
    if (!apiVersion || apiVersion !== '1') {
        return res.status(400).json({ 
            success: false,
            message: "API version header required",
        });
    }

    next()
}
export default checkVersion;
