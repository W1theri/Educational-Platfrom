const app = require('./app')
const { connectMongo } = require('./db/mongo')

const PORT = 3000

async function bootstrap() {
    try {
        await connectMongo()

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`)
        })
    } catch (err) {
        console.error('Failed to start server', err)
        process.exit(1)
    }
}

bootstrap().catch(err => {
    console.error('Failed to start server', err)
    process.exit(1)
})