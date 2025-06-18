const {Client}=require('pg')
const express=require('express')

const app= express()
app.use(express.json())

const con=new Client({
    host:"localhost",
    user:"postgres",
    port:5432,
    password: "DLY1fp/",
    database: "vibewiredb",
})

con.connect().then(()=> console.log("connected"))

app.post('/postData' , (req,res)=>{

    const {name,id,bio,image} = req.body

    const insert_query='INSERT INTO person (name,id,bio,image) VALUES ($1,$2,$3,$4)'

    con.query(insert_query,[name,id,bio,image],(err,result)=>{
        if(err)
        {
            res.send(err);
        }
        else
        {
            console.log(result)
            res.send("POSTED DATA")
        }
    })
})


app.get('/fetchData',(req,res)=>{
const fetch_query="Select * from person"
con.query(fetch_query,(err,result)=>{
    if(err)
    {
        res.send(err)
    }
    else

    {
        res.send(result.rows)
    }
})

})

app.get('/fetchbyId/:id',(req,res)=>{
    const id=req.params.id
    const fetch_query="Select * from person where id=$1"
    con.query(fetch_query,[id],(err,result)=>{
if(err){
    res.send(err)
}
else
{
    res.send(result.rows[0])
}
    })
})

app.put('/update/:id',(req,res)=>{
    const id=req.params.id;
    const name=req.body.name;
    const bio=req.body.bio;
    const image=req.body.image;

    const update_query="UPDATE person SET name=$1, bio=$2,image=$3 WHERE id=$4"
    con.query(update_query,[name,bio,image,id],(err,result)=>{
        if(err)
        {
            res.send(err)
        }
        else
{
    res.send("UPDATED")
}
    })
})

app.delete('/delete/:id',(req,res)=>{
const id=req.params.id;
const delete_query='Delete from person WHERE id=$1'
con.query(delete_query,[id],(err,result)=>{
    if(err)
    {
        res.send(err)
    }
    else
    {
        res.send("Deleted")
    }
})
})

app.listen(3000,()=>{
    console.log("server is running")
})