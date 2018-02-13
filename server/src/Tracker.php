<?php
namespace WebMap;
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use SQLite3;
use ArrayObject;

class Userdb extends SQLite3{
    function __construct() {
        $this->open('user.db');
    }
}


class User{
	protected $userdb;

	public function __construct(){
		$this->userdb = new Userdb;
		if(!$this->userdb){
     		echo $this->userdb->lastErrorMsg();;
   		}else{
   		$ret = $this->userdb->exec('CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY AUTOINCREMENT, user_name CHAR(30)  NOT NULL, token TEXT, password TEXT)');
   		if(!$ret){
      		echo $this->userdb->lastErrorMsg();
   		}}
	}

	private function token_generator($user_name){
		while(1){
			$token = bin2hex(random_bytes(120));
			$check_token_sql = "SELECT COUNT(*) FROM users WHERE token='$token'";
			$check_token_result = $this->userdb->query($check_token_sql);
			$check_token_array = $check_token_result->fetchArray(SQLITE3_ASSOC);
			if((int)$check_token_array['COUNT(*)'] == 0){
				$this->userdb->exec("UPDATE users SET token='$token' WHERE user_name='$user_name'");
				return $token;
			}else{
				continue;
			}
		}
	}

	public function user_exists($user_name){
		$result = $this->userdb->query("SELECT COUNT(*) FROM users WHERE user_name='$user_name'");
		$user_array = $result->fetchArray(SQLITE3_ASSOC);
		if((int)$user_array['COUNT(*)'] > 0){
			return true;
		}else{
			return false;
		}
	}
		
	public function user_register($user_name, $password){
		$pass = password_hash($password, PASSWORD_DEFAULT);
		if($this->userdb->exec("INSERT INTO users(user_name, password)VALUES('$user_name', '$pass')")){
			return true;
		}else{
			return false;
		}
	}

	public function user_login($user_name, $password){
		$result = $this->userdb->query("SELECT user_name, password, COUNT(*) FROM users WHERE user_name='$user_name'");
		$user_array = $result->fetchArray(SQLITE3_ASSOC);
		if((int)$user_array['COUNT(*)'] > 0){
			if(password_verify($password, $user_array['password'])){
				return array("user_name"=>$user_array['user_name'], "token"=>$this->token_generator($user_array['user_name']));
			}else{
				return null;
			}
		}else{
			return null;
		}
	}

	public function user_logout($user_name){
		if($this->userdb->exec("UPDATE users SET token='none' WHERE user_name='$user_name'")){
			return true;
		}else{
			return false;
		}
	}

	public function user_logged_in($user_name, $token){
		$result = $this->userdb->query("SELECT COUNT(*) FROM users WHERE user_name='$user_name' AND token='$token' AND token!='none'");
		$user_array = $result->fetchArray(SQLITE3_ASSOC);
		if((int)$user_array['COUNT(*)'] > 0){
			return true;
		}else{
			return false;
		}
	}
}


class Tracker implements MessageComponentInterface {
    protected $clients;
    protected $users;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->users = new User;
    }

    public function send_all($msg, $conn){
    	foreach ($this->clients as $client){
            if ($conn !== $client->conn){
                $client->conn->send($msg);
            }
        }
    }

    public function check_connection($user_name){
    	$conn_exists = 0;
    	foreach ($this->clients as $client){
            if ($user_name == $client->user_name){
                $conn_exists = 1;
            }
        }
        if($conn_exists == 1){
        	return true;
        }else{
        	return false;
        }
    }

    public function logout_connection($user_name){
    	foreach ($this->clients as $client){
            if ($user_name == $client->user_name){
            	$this->send_all(json_encode(array("type"=>"removed", "user_name"=>$user_name)), $client->conn);
                $this->clients->detach($client);
            }
        }
    }

    public function remove_connection($conn){
    	foreach ($this->clients as $client){
            if ($conn == $client->conn){
            	$this->send_all(json_encode(array("type"=>"removed", "user_name"=>$client->user_name)), $conn);
                $this->clients->detach($client);
            }
        }
    }

    public function onOpen(ConnectionInterface $conn) {
    	$msg = json_encode(array("type"=>"connection", "message"=>"Connection Established"));
        $conn->send($msg);
    }

    public function onMessage(ConnectionInterface $from, $msg) {
    	$msgObj = json_decode($msg);
    	if(isset($msgObj->type)){
    		if($msgObj->type == "register"){
    			if($this->users->user_exists($msgObj->user_name)){
    				$from->send(json_encode(array("type"=>"error", "message"=>"Username Exists")));
    			}else{
    				if($this->users->user_register($msgObj->user_name, $msgObj->password)){
    					$from->send(json_encode(array("type"=>"register", "message"=>"Registered Successfully")));
    				}else{
    					$from->send(json_encode(array("type"=>"error", "message"=>"Registration Failed")));
    				}
    			}
    		}elseif($msgObj->type == "login"){
    			if($this->users->user_exists($msgObj->user_name)){
    				$resObj = $this->users->user_login($msgObj->user_name, $msgObj->password);
    				if($resObj != null){
    					$client = new ArrayObject(array("conn"=>$from, "user_name"=>$msgObj->user_name),  ArrayObject::ARRAY_AS_PROPS);
    					$this->clients->attach($client);
    					$from->send(json_encode(array("type"=>"login", "user_name"=>$resObj['user_name'], "token"=>$resObj['token'])));
    				}else{
    					$from->send(json_encode(array("type"=>"error", "message"=>"Login Failed")));
    				}
    			}else{
    				$from->send(json_encode(array("type"=>"error", "message"=>"Invalid Credentials")));
    			}
    		}elseif($msgObj->type == "data"){
    			if($this->users->user_logged_in($msgObj->user_name, $msgObj->token)){
    				if($this->check_connection($msgObj->user_name)){
    					$this->send_all(json_encode(array("type"=>"data", "user_name"=>$msgObj->user_name, "coordinates"=>$msgObj->coordinates)), $from);
    				}else{
    					$client = new ArrayObject(array("conn"=>$from, "user_name"=>$msgObj->user_name),  ArrayObject::ARRAY_AS_PROPS);
    					$this->clients->attach($client);
    					$this->send_all(json_encode(array("type"=>"data", "user_name"=>$msgObj->user_name, "coordinates"=>$msgObj->coordinates)), $from);
    				}
    			}else{
    				$from->send(json_encode(array("type"=>"error", "message"=>"Not Logged In")));
    			}
    		}elseif($msgObj->type == "logout"){
    			if($this->users->user_logged_in($msgObj->user_name, $msgObj->token)){
    				if($this->check_connection($msgObj->user_name)){
    					if($this->users->user_logout($msgObj->user_name)){
    						$this->logout_connection($msgObj->user_name);
    						$from->send(json_encode(array("type"=>"logout", "message"=>"Logged Out")));
    					}else{
    						$from->send(json_encode(array("type"=>"error", "message"=>"Logout Failed")));
    					}
    				}else{
    					$client = new ArrayObject(array("conn"=>$from, "user_name"=>$msgObj->user_name),  ArrayObject::ARRAY_AS_PROPS);
    					$this->clients->attach($client);
    					if($this->users->user_logout($msgObj->user_name)){
    						$this->logout_connection($msgObj->user_name);
    						$from->send(json_encode(array("type"=>"logout", "message"=>"Logged Out")));
    					}else{
    						$from->send(json_encode(array("type"=>"error", "message"=>"Logout Failed")));
    					}
    				}
    			}else{
    				$from->send(json_encode(array("type"=>"error", "message"=>"Not Logged In")));
    			}
    		}else{
    			$from->send(json_encode(array("type"=>"error", "message"=>"Unknown Type")));
    		}
    	}
    }

    public function onClose(ConnectionInterface $conn) {
        $this->remove_connection($conn);
	}

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";

        $conn->close();
    }
}