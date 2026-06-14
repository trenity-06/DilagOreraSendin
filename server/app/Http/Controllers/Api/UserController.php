<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function loadUsers (Request $request)
    {

        $search = $request->input('search');

        $users = User::with(['gender'])
            ->leftJoin('tbl_genders', 'tbl_users.gender_id', '=', 'tbl_genders.gender_id')
            ->where('tbl_users.is_deleted', false)
            ->orderBy('tbl_users.last_name', 'asc')
            ->orderBy('tbl_users.first_name', 'asc')
            ->orderBy('tbl_users.middle_name', 'asc')
            ->orderBy('tbl_users.suffix_name', 'asc');

        if ($search) {
            $users->where(function ($user) use ($search) {
                $user->where('tbl_users.first_name', 'like', "%{$search}%")
                    ->orWhere('tbl_users.middle_name', 'like', "%{$search}%")
                    ->orWhere('tbl_users.last_name', 'like', "%{$search}%")
                    ->orWhere('tbl_users.suffix_name', 'like', "%{$search}%")
                    ->orWhere('tbl_genders.gender', 'like', "%{$search}%");
            });
        }

        $users = $users->paginate(15);

        $users->getCollection()->transform(function($user){
            $user->profile_picture = $user->profile_picture ? url('storage/img/user/profile_picture/' .
            $user->profile_picture) : null;

            return $user;
        });

        return response ()->json([
            'users' => $users
        ], 200);

    }

    public function storeUser(Request $request)
    {

        $validated = $request->validate([
            'add_user_profile_picture' => ['nullable', 'image', 'mimes:png, jpg,jpeg'],
            'first_name' => ['required', 'string', 'max:55'],
            'middle_name' => ['nullable', 'string', 'max:55'],
            'last_name' => ['required', 'string', 'max:55'],
            'suffix_name' => ['nullable', 'string', 'max:255'],
            'gender' => ['required'],
            'birth_date' => ['required', 'date'],
            'username' => ['required', 'min:6', 'max:12', Rule::unique('tbl_users', 'username')],
            'password' => ['required', 'min:6', 'max:12', 'confirmed'],
            'password_confirmation' => ['required', 'min:6', 'max:12'],
        ]);
        if ($request->hasFile('add_user_profile_picture')) {
            $filenameWithExtension = $request->file('add_user_profile_picture');
            $filename = pathinfo($filenameWithExtension, PATHINFO_FILENAME);
            $extension = $filenameWithExtension->getClientOriginalExtension();
            $filenameToStore = sha1($filename . '_' . time() . '.' . $extension);
            $filenameWithExtension->storeAs('img/user/profile_picture', $filenameToStore, 'public');
            $validated['add_user_profile_picture'] = $filenameToStore;
        }

        $age = date_diff(date_create($validated['birth_date']), date_create('now'))->y;

        User::create([
            'profile_picture' => $validated['add_user_profile_picture'],
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'],
            'last_name' => $validated['last_name'],
            'suffix_name' => $validated['suffix_name'],
            'gender_id' => $validated['gender'],
            'birth_date' => $validated['birth_date'],
            'age' => $age,
            'username' => $validated['username'],
            'password' => $validated['password']
        ]);

        return response()->json([
            'message' => 'User  Successfully Saved',
        ], 200);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        }

        $validated = $request->validate([
            'edit_user_profile_picture' => ['nullable', 'image', 'mimes:png, jpg,jpeg'],
            'first_name' => ['required', 'string', 'max:55'],
            'middle_name' => ['nullable', 'string', 'max:55'],
            'last_name' => ['required', 'string', 'max:55'],
            'suffix_name' => ['nullable', 'string', 'max:255'],
            'gender' => ['required'],
            'birth_date' => ['required', 'date'],
            'username' => ['required', 'min:6', 'max:12', Rule::unique('tbl_users', 'username') ->ignore($user)],
        ]);

        if($request->has('remove_profile_picture') && $request->remove_profile_picture == '1') {
            if($user->profile_picture && Storage::disk('public')->exists('img/user/profile_picture/' . $user->profile_picture)) {
               Storage::disk('public')->delete('img/user/profile_picture/' . $user->profile_picture);
                $user->profile_picture = null;
                }

        } else if ($request->hasFile('edit_user_profile_picture')) {
            if($user->profile_picture && Storage::disk('public')->exists('img/user/profile_picture/' . $user->profile_picture)) {
                Storage::disk('public')->delete('img/user/profile_picture/' . $user->profile_picture);
            }
            $filenameWithExtension = $request->file('edit_user_profile_picture');
            $filename = pathinfo($filenameWithExtension->getClientOriginalName(), PATHINFO_FILENAME);
            $extension = $filenameWithExtension->getClientOriginalExtension();
            $filenameToStore = sha1($filename . '_' . time() . '.' . $extension);
            $filenameWithExtension->storeAs('img/user/profile_picture', $filenameToStore, 'public');
            $validated['edit_user_profile_picture'] = $filenameToStore;
        }

        $age = date_diff(date_create($validated['birth_date']), date_create('now'))->y;

        $user->update([
            'profile_picture' => $validated['edit_user_profile_picture'] ?? $user->profile_picture,
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'],
            'last_name' => $validated['last_name'],
            'suffix_name' => $validated['suffix_name'],
            'gender_id' => $validated['gender'],
            'birth_date' => $validated['birth_date'],
            'age' => $age,
            'username' => $validated['username'],
        ]);

        $user->profile_picture = $user->profile_picture ? url('storage/img/user/profile_picture/' .
        $user->profile_picture) : null;

        return response()->json([
            'message' => 'User Successfully Updated',
            'user' => $user->load('gender')
        ], 200);
    }

    public function destroyUser(User $user) {
        $user->update([
            'is_deleted' => true
        ]);

        return response()->json([
            'message' => 'User Successfully Deleted'
        ], 200);
    }
}
